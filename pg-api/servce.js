const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const staticDirectory = path.join(__dirname, 'static');
const uploadDirectories = {
  ownerImg: path.join(staticDirectory, 'uploads', 'owner'),
  houseImg: path.join(staticDirectory, 'uploads', 'house'),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

app.use('/static', express.static(staticDirectory));

function createSafeFilename(value, fallback) {
  const filename = String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim();

  return filename || fallback;
}

function saveImageFile(file, id) {
  const safeId = createSafeFilename(id, 'unknown');
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${safeId}-${file.fieldname}${extension}`;
  const targetDirectory = uploadDirectories[file.fieldname];
  const targetPath = path.join(targetDirectory, filename);

  fs.readdirSync(targetDirectory)
    .filter((item) => item.startsWith(`${safeId}-${file.fieldname}.`))
    .forEach((item) => {
      fs.unlinkSync(path.join(targetDirectory, item));
    });

  fs.writeFileSync(targetPath, file.buffer);

  return filename;
}

const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
      return;
    }

    callback(new Error('只允许上传图片文件'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================================
// 路由收集器
// ================================
const registeredRoutes = [];

const originalGet = app.get.bind(app);
const originalPost = app.post.bind(app);

app.get = (path, ...handlers) => {
  registeredRoutes.push({
    method: 'GET',
    path,
  });

  return originalGet(path, ...handlers);
};

app.post = (path, ...handlers) => {
  registeredRoutes.push({
    method: 'POST',
    path,
  });

  return originalPost(path, ...handlers);
};

// ================================
// 读取配置：优先环境变量（.env），config.toml 仅作为本地遗留兜底
// 真实密码一律不写进仓库，只放在 .env / 环境变量里
// ================================
require('dotenv').config({ path: path.join(__dirname, '.env') });

function readConfigValue(content, key) {
  const reg = new RegExp(
    `^\\s*${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s#]+))`,
    'm',
  );

  const result = content.match(reg);

  if (!result) {
    return undefined;
  }

  return result[1] ?? result[2] ?? result[3];
}

function readSectionValue(content, section, key) {
  const sectionMatch = content.match(
    new RegExp(`\\[${section}\\]([\\s\\S]*?)(?=\\n\\s*\\[|$)`, 'm'),
  );

  return sectionMatch ? readConfigValue(sectionMatch[1], key) : undefined;
}

const legacyConfigPath = path.join(__dirname, 'config.toml');
const rawConfig = fs.existsSync(legacyConfigPath)
  ? fs.readFileSync(legacyConfigPath, 'utf8')
  : '';

function legacyValue(key, section) {
  if (!rawConfig) {
    return undefined;
  }

  return section
    ? readSectionValue(rawConfig, section, key)
    : readConfigValue(rawConfig, key);
}

function envValue(name, fallback) {
  const value = process.env[name];

  return value === undefined || value === '' ? fallback : value;
}

const cfg = {
  host: envValue('DB_HOST', legacyValue('host') || '127.0.0.1'),
  port: Number(envValue('DB_PORT', legacyValue('port') || 5432)),
  user: envValue('DB_USER', legacyValue('user') || 'postgres'),
  password: envValue('DB_PASSWORD', legacyValue('password') || ''),
  database: envValue('DB_NAME', legacyValue('database') || 'fencengfenhu'),
  serverPort: Number(
    envValue(
      'SERVER_PORT',
      legacyValue('serverPort') ||
        legacyValue('server_port') ||
        legacyValue('port', 'server') ||
        legacyValue('server_port', 'server') ||
        8090,
    ),
  ),
};

if (!cfg.password) {
  console.warn(
    '  ! 未读取到数据库密码：请在 pg-api/.env 里配置 DB_PASSWORD（参考 .env.example）',
  );
}

// ================================
// PostgreSQL 连接池
// ================================
const pool = new Pool({
  host: cfg.host,
  port: cfg.port,
  user: cfg.user,
  password: cfg.password,
  database: cfg.database,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool
  .query('SELECT 1')
  .then(() => {
    console.log('  ✓ PostgreSQL 数据库连接成功');
    console.log(`  ✓ 数据库: ${cfg.database}`);
  })
  .catch((err) => {
    console.log('  ✗ PostgreSQL 数据库连接失败:', err.message);
  });

// ================================
// 请求日志
// ================================
app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`,
  );
  next();
});

// ================================
// 工具函数
// ================================

// 将前端传入的 polygonJson 转换为 GeoJSON Geometry
function parseGeometry(value) {
  if (!value) {
    throw new Error('缺少多边形数据');
  }

  let data = value;

  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  // Turf polygon 返回的是 Feature，需要取 geometry
  if (data.type === 'Feature') {
    data = data.geometry;
  }

  if (!data || data.type !== 'Polygon' || !Array.isArray(data.coordinates)) {
    throw new Error('GeoJSON 多边形格式错误');
  }

  return data;
}

// 兼容以下两种格式：
// 1. JSON.stringify([[lng, lat], [lng, lat], ...])
// 2. "lng,lat,lng,lat,..."
function parseUnitGeometry(value) {
  if (!value) {
    throw new Error('缺少户型多边形数据');
  }

  let coordinates;

  if (typeof value === 'string') {
    const text = value.trim();

    try {
      coordinates = JSON.parse(text);
    } catch {
      const values = text.split(',').map(Number);

      if (
        values.length < 6 ||
        values.length % 2 !== 0 ||
        values.some((item) => !Number.isFinite(item))
      ) {
        throw new Error('户型坐标格式错误');
      }

      coordinates = [];

      for (let index = 0; index < values.length; index += 2) {
        coordinates.push([values[index], values[index + 1]]);
      }
    }
  } else {
    coordinates = value;
  }

  // 兼容 [[[lng, lat], ...]] 格式
  if (
    Array.isArray(coordinates) &&
    coordinates.length === 1 &&
    Array.isArray(coordinates[0])
  ) {
    coordinates = coordinates[0];
  }

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 3 ||
    coordinates.some(
      (item) =>
        !Array.isArray(item) ||
        item.length < 2 ||
        !Number.isFinite(Number(item[0])) ||
        !Number.isFinite(Number(item[1])),
    )
  ) {
    throw new Error('户型坐标格式错误');
  }

  const normalizedCoordinates = coordinates.map((item) => [
    Number(item[0]),
    Number(item[1]),
  ]);

  const firstPoint = normalizedCoordinates[0];
  const lastPoint = normalizedCoordinates[normalizedCoordinates.length - 1];

  // 确保多边形首尾闭合
  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    normalizedCoordinates.push([...firstPoint]);
  }

  return {
    type: 'Polygon',
    coordinates: [normalizedCoordinates],
  };
}

// ================================
// 接口1：getBuild
// 获取楼栋信息
// ================================
app.get('/api/v1/getBuild', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        floors_num AS "floorsNum",
        ST_AsGeoJSON(polygon)::json AS polygon,
        create_at AS "createAt",
        update_at AS "updateAt"
      FROM building
      WHERE delete_at IS NULL
      ORDER BY id
    `);

    res.json({
      code: 200,
      message: '成功',
      data: result.rows,
    });
  } catch (err) {
    console.error('getBuild 失败:', err);

    res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
});

// ================================
// 接口2：getHouse
// 分页获取房户信息（支持按 building_id 查询）
// ================================
app.get('/api/v1/getHouse', async (req, res) => {
  try {
    const { id, pageIndex = 1, noPage = 0 } = req.query;

    const pageSize = 10;
    const currentPage = Math.max(Number(pageIndex) || 1, 1);
    const offset = (currentPage - 1) * pageSize;

    const whereParts = [];
    const countParams = [];

    if (id) {
      whereParts.push(`u.build_id = $1`);
      countParams.push(Number(id));
    }

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM household h
      JOIN unit u ON h.unit_id = u.id
      ${whereClause}
      `,
      countParams,
    );

    const total = countResult.rows[0].total;

    const queryParams = [...countParams];

    let query = `
      SELECT
        h.id,
        h.unit_id AS "unitId",
        h.min_height AS "minHeight",
        h.max_height AS "maxHeight",
        u.number,
        h.floor_num AS "floorNum",
        h.owner_name AS "ownerName",
        h.house_address AS "houseAddress",
        ST_AsGeoJSON(u.polygon)::json AS polygon
      FROM household h
      JOIN unit u ON h.unit_id = u.id
      ${whereClause}
      ORDER BY h.floor_num, h.house_address
    `;

    if (Number(noPage) !== 1) {
      query += `
        LIMIT $${queryParams.length + 1}
        OFFSET $${queryParams.length + 2}
      `;

      queryParams.push(pageSize, offset);
    }

    const result = await pool.query(query, queryParams);

    res.json({
      code: 200,
      message: '成功',
      data: {
        total,
        list: result.rows,
      },
    });
  } catch (err) {
    console.error('getHouse 失败:', err);

    res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
});

// ================================
// 接口3：getOneHouseInfo
// 获取单个住户详细信息
// ================================
app.get('/api/v1/getOneHouseInfo', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        code: 400,
        message: '缺少住户 id',
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        unit_id AS "unitId",
        floor_num AS "floorNum",
        min_height AS "minHeight",
        max_height AS "maxHeight",
        owner_name AS "ownerName",
        id_card AS "idCard",
        phone_num AS "phoneNum",
        owner_sex AS "ownerSex",
        native_place AS "nativePlace",
        owner_img AS "ownerImg",
        house_type AS "houseType",
        built_area AS "builtArea",
        orientation,
        property_type AS "propertyType",
        house_img AS "houseImg",
        house_address AS "houseAddress"
      FROM household
      WHERE id = $1
      `,
      [Number(id)],
    );

    res.json({
      code: 200,
      message: '成功',
      data: result.rows[0] || null,
    });
  } catch (err) {
    console.error('getOneHouseInfo 失败:', err);

    res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
});

// ================================
// 接口4：addHouse
// 创建楼栋、单元和住户
// ================================
app.post('/api/v1/addHouse', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      polygonJson,
      polygonJsonArr = [],
      unitArr = [],
      heightArr = [],
      name,
      floorNum,
    } = req.body;

    if (!polygonJson) {
      return res.status(400).json({
        code: 400,
        message: '缺少楼栋多边形 polygonJson',
      });
    }

    if (!Array.isArray(polygonJsonArr) || polygonJsonArr.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '缺少户型多边形 polygonJsonArr',
      });
    }

    const floors = Number(floorNum);

    if (!Number.isInteger(floors) || floors <= 0) {
      return res.status(400).json({
        code: 400,
        message: '楼层数必须是大于 0 的整数',
      });
    }

    const buildingGeometry = parseGeometry(polygonJson);

    const lowest = Number(heightArr[0] || 0);
    const split = Number(heightArr[1] || 0);
    const highest = Number(heightArr[2] || 0);

    await client.query('BEGIN');

    // 1. 写入 building 表
    const buildingResult = await client.query(
      `
      INSERT INTO building (
        name,
        floors_num,
        polygon,
        create_at,
        update_at
      )
      VALUES (
        $1,
        $2,
        ST_SetSRID(
          ST_GeomFromGeoJSON($3),
          4326
        ),
        NOW(),
        NOW()
      )
      RETURNING
        id,
        name,
        floors_num AS "floorsNum"
      `,
      [name || '未命名楼栋', floors, JSON.stringify(buildingGeometry)],
    );

    const building = buildingResult.rows[0];

    const createdUnits = [];
    const createdHouseholds = [];

    // 2. 写入 unit 表
    for (let unitIndex = 0; unitIndex < polygonJsonArr.length; unitIndex++) {
      const unitGeometry = parseUnitGeometry(polygonJsonArr[unitIndex]);

      const unitNumber = Number(unitArr[unitIndex] || unitIndex + 1);

      const unitResult = await client.query(
        `
        INSERT INTO unit (
          build_id,
          number,
          polygon
        )
        VALUES (
          $1,
          $2,
          ST_SetSRID(
            ST_GeomFromGeoJSON($3),
            4326
          )
        )
        RETURNING
          id,
          build_id AS "buildId",
          number,
          ST_AsGeoJSON(polygon)::json AS polygon
        `,
        [building.id, unitNumber, JSON.stringify(unitGeometry)],
      );

      const unit = unitResult.rows[0];
      createdUnits.push(unit);

      // 3. 写入 household 表
      const itemHeight = floors > 1 ? (highest - lowest) / (floors - 1) : 0;

      for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
        let minHeight;
        let maxHeight;

        if (floorIndex === 0) {
          minHeight = lowest;
          maxHeight = split;
        } else {
          minHeight = split + (floorIndex - 1) * itemHeight;
          maxHeight = minHeight + itemHeight;
        }

        const houseAddress = `${name || '未命名楼栋'}${unitNumber}单元${
          floorIndex + 1
        }层`;

        const householdResult = await client.query(
          `
          INSERT INTO household (
            unit_id,
            floor_num,
            min_height,
            max_height,
            house_address
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            unit_id AS "unitId",
            floor_num AS "floorNum",
            min_height AS "minHeight",
            max_height AS "maxHeight",
            house_address AS "houseAddress"
          `,
          [unit.id, floorIndex + 1, minHeight, maxHeight, houseAddress],
        );

        createdHouseholds.push(householdResult.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.json({
      code: 200,
      message: '分户成功',
      data: {
        building,
        units: createdUnits,
        households: createdHouseholds,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');

    console.error('addHouse 失败:', err);

    res.status(500).json({
      code: 500,
      message: err.message,
    });
  } finally {
    client.release();
  }
});

// ================================
// 接口5：updateInfo
// 更新住户信息
// ================================
app.post(
  '/api/v1/updateInfo',
  uploadImages.fields([
    { name: 'ownerImg', maxCount: 1 },
    { name: 'houseImg', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        id,
        unitId,
        floorNum,
        minHeight,
        maxHeight,
        ownerName,
        idCard,
        phoneNum,
        ownerSex,
        nativePlace,
        ownerImg,
        houseType,
        builtArea,
        orientation,
        propertyType,
        houseImg,
        houseAddress,
      } = req.body;

      const ownerImage = req.files?.ownerImg?.[0];
      const houseImage = req.files?.houseImg?.[0];
      const ownerImageFilename = ownerImage
        ? saveImageFile(ownerImage, id)
        : null;
      const houseImageFilename = houseImage
        ? saveImageFile(houseImage, id)
        : null;
      const ownerImagePath = ownerImageFilename
        ? `/static/uploads/owner/${ownerImageFilename}`
        : ownerImg || null;
      const houseImagePath = houseImageFilename
        ? `/static/uploads/house/${houseImageFilename}`
        : houseImg || null;

      if (!id) {
        return res.status(400).json({
          code: 400,
          message: '缺少住户 id',
        });
      }

      const result = await pool.query(
        `
      UPDATE household
      SET
        unit_id = $1,
        floor_num = $2,
        min_height = $3,
        max_height = $4,
        owner_name = $5,
        id_card = $6,
        phone_num = $7,
        owner_sex = $8,
        native_place = $9,
        owner_img = $10,
        house_type = $11,
        built_area = $12,
        orientation = $13,
        property_type = $14,
        house_img = $15,
        house_address = $16
      WHERE id = $17
      RETURNING
        id,
        unit_id AS "unitId",
        floor_num AS "floorNum",
        min_height AS "minHeight",
        max_height AS "maxHeight",
        owner_name AS "ownerName",
        id_card AS "idCard",
        phone_num AS "phoneNum",
        owner_sex AS "ownerSex",
        native_place AS "nativePlace",
        owner_img AS "ownerImg",
        house_type AS "houseType",
        built_area AS "builtArea",
        orientation,
        property_type AS "propertyType",
        house_img AS "houseImg",
        house_address AS "houseAddress"
      `,
        [
          unitId,
          floorNum,
          minHeight,
          maxHeight,
          ownerName,
          idCard,
          phoneNum,
          ownerSex,
          nativePlace,
          ownerImagePath,
          houseType,
          builtArea,
          orientation,
          propertyType,
          houseImagePath,
          houseAddress,
          id,
        ],
      );

      res.json({
        code: 200,
        message: '更新成功',
        data: result.rows[0] || null,
      });
    } catch (err) {
      console.error('updateInfo 失败:', err);

      res.status(500).json({
        code: 500,
        message: err.message,
      });
    }
  },
);

// ================================
// 启动服务
// ================================
app.listen(cfg.serverPort, () => {
  console.log('========================================');
  console.log('  API 服务已启动');
  console.log(`  地址: http://localhost:${cfg.serverPort}`);
  console.log(`  PostgreSQL: ${cfg.host}:${cfg.port}`);
  console.log(`  数据库: ${cfg.database}`);
  console.log('========================================');
  console.log('  已注册接口:');
  console.log('----------------------------------------');

  registeredRoutes.forEach((route) => {
    console.log(`  ${route.method.padEnd(6)} ${route.path}`);
  });

  console.log('----------------------------------------');
  console.log('  等待请求中... (Ctrl+C 停止)');
  console.log('========================================');
});
