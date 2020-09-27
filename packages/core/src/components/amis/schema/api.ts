import { Api } from 'amis/lib/types'
import { qsstringify } from 'amis/lib/utils/helper'
import { dataMapping, tokenize } from 'amis/lib/utils/tpl-builtin'
import { cloneDeep, isPlainObject } from 'lodash'
import { parse } from 'qs'

import { app } from '@/app'
import logger from '@/utils/logger'
import { normalizeUrl } from '@/utils/request'

const log = logger.getLogger('lib:amis:api')

/**
 * 注意：Amis buildApi 方法，不支持 Ovine 请求字符串格式。
 * 因此会将所有请求都处理为 默认 get 请求。除非传入确的小写 method
 */

/**
 * amis 请求返回值格式
 * @param res 请求返回值
 */
function responseAdaptor(res: any) {
  const { data } = res

  if (!data) {
    throw new Error('Response is empty!')
  } else if (typeof data.status === 'undefined') {
    throw new Error('接口返回格式不符合，请参考 http://amis.baidu.com/v2/docs/api')
  }

  return {
    ok: data.status === 0,
    status: data.status,
    msg: data.msg,
    msgTimeout: data.msgTimeout,
    data: data.data,
    errors: data.errors,
  }
}

// 字符串转 Function
function str2function(name: string, content: string, ...args: Array<string>): Function | null {
  try {
    // eslint-disable-next-line
    const func = new Function(...args, content)
    return func
  } catch (error) {
    log.warn(`Request模块 ${name} 转 Function 错误`, error)
    return null
  }
}

/**
 * 重写 amis api 请求模块，并兼容 amis 参数
 */
export const libFetcher = (
  api: Api,
  data: object,
  option: {
    autoAppend?: boolean
    ignoreData?: boolean
    [propName: string]: any
  } = {}
): any => {
  const amisApi: any =
    typeof api === 'string'
      ? {
          url: api,
        }
      : isPlainObject(api)
      ? { ...api }
      : {}

  // 提示与 amis 不兼容的地方
  if (!amisApi.url || typeof amisApi.url !== 'string') {
    throw new Error('请求模块一定要传 url 字符串格式参数')
  }

  // 去除末尾多余的 ? 号
  amisApi.url = amisApi.url.replace(/\?{1,}$/, '')

  // 添加参数
  amisApi.api = amisApi.api || amisApi.url
  amisApi.config = option
  amisApi.isEnvFetcher = true

  const { requestAdaptor, adaptor, onPreRequest, onRequest, onSuccess, onError } = amisApi

  if (requestAdaptor || adaptor) {
    log.warn(
      '不兼容 requestAdaptor,adaptor 参数，请使用 onPreRequest, onSuccess 代替。文档地址：https://ovine.igroupes.com/org/docs/modules/request'
    )
  }

  // 检测是回调字符串 转 Function
  if (onPreRequest && typeof onPreRequest === 'string') {
    amisApi.onPreRequest = str2function('onPreRequest', onPreRequest, 'option')
  }
  if (onRequest && typeof onRequest === 'string') {
    amisApi.onRequest = str2function('onRequest', onRequest, 'option')
  }
  if (onSuccess && typeof onSuccess === 'string') {
    amisApi.onSuccess = str2function('onSuccess', onSuccess, 'source', 'option', 'response')
  }
  if (onError && typeof onError === 'string') {
    amisApi.onError = str2function('onError', onError, 'response', 'option', 'error')
  }

  // 特殊情况 不作处理
  if (!data || data instanceof FormData || data instanceof Blob || data instanceof ArrayBuffer) {
    amisApi.data = data || {}
  } else {
    const { url } = amisApi
    const { method } = normalizeUrl(url, amisApi.method)
    const { autoAppend, ignoreData } = option
    const idx = url.indexOf('?')
    const hashIdx = url.indexOf('#')
    const hasString = hashIdx !== -1 ? url.substring(hashIdx) : ''

    // 与 amis 默认逻辑保持一致
    if (idx === -1) {
      amisApi.url = tokenize(url, data, '| url_encode')
    } else {
      const urlParams = parse(url.substring(idx + 1, hashIdx !== -1 ? hashIdx : undefined))
      amisApi.url =
        tokenize(url.substring(0, idx + 1), data, '| url_encode') +
        qsstringify(dataMapping(urlParams, data), amisApi.qsOptions) +
        hasString
    }

    if (!ignoreData) {
      if (amisApi.data) {
        amisApi.rawData = cloneDeep(amisApi.data)
        amisApi.data = dataMapping(amisApi.data, data)
      } else if (/POST|PUT/.test(method) || (/GET/i.test(method) && autoAppend)) {
        amisApi.data = cloneDeep(data)
      }
    }
    // 备份原始数据
    if (!amisApi.rawData) {
      amisApi.rawData = !data ? {} : cloneDeep(data)
    }
  }

  return app.request(amisApi).then(responseAdaptor)
}
