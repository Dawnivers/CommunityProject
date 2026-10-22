import api from './baseApi'
//baseURL: 'http://127.0.0.1:8090/api/v1', // 所有请求的公共地址部分
export const getBuild = (params) => api.get(`/getBuild`, params)
export const addHouse = (params) => api.post(`/addHouse`, params)
export const updateInfo = (params) => api.post(`/updateInfo`, params)
export const getHouse = (params) => api.get(`/getHouse`, { params })
export const getOneHouseInfo = (params) => api.get(`/getOneHouseInfo`, { params })
