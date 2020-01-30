import * as util from 'util'
import { AccessToken } from '../AccessToken'
import { ApiConfig } from '../ApiConfig'
import { IAccessTokenCache } from '../cache/IAccessTokenCache'
import { QyApiConfigKit } from './QyApiConfigKit'
import { HttpKit } from '@tnwx/kits'

/**
 * @author Javen
 * @copyright javendev@126.com
 * @description 企业微信 AccessToken
 */
export class QyAccessTokenApi {
  static SEPARATOR: string = '_'
  private static url: string = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=%s&corpsecret=%s'
  /**
   *  获取 acces_token
   *  1、先从缓存中获取，如果可用就直接返回
   *  2、如果缓存中的已过期就调用刷新接口来获取新的 acces_token
   */
  public static async getAccessToken() {
    let ac: ApiConfig = QyApiConfigKit.getApiConfig
    let accessToken: AccessToken | undefined = this.getAvailableAccessToken(ac)
    if (accessToken) {
      if (QyApiConfigKit.isDevMode) {
        console.debug('缓存中的 accesstoken')
      }
      return accessToken
    }
    if (QyApiConfigKit.isDevMode) {
      console.debug('刷新 accesstoken')
    }
    return await this.refreshAccessToken(ac)
  }

  /**
   *  通过 appId 从缓存中获取 acces_token
   *  @param apiConfig
   */
  private static getAvailableAccessToken(apiConfig: ApiConfig): AccessToken | undefined {
    let result: AccessToken | undefined
    let accessTokenCache: IAccessTokenCache = QyApiConfigKit.getAccessTokenCache
    let accessTokenJson: string = accessTokenCache.get(apiConfig.getAppId.concat(this.SEPARATOR).concat(apiConfig.getCorpId))
    if (accessTokenJson) {
      result = new AccessToken(accessTokenJson)
    }
    if (result && result.isAvailable()) {
      return result
    } else {
      return undefined
    }
  }

  /**
   *  获取新的 acces_token 并设置缓存
   *  @param apiConfig
   */
  public static async refreshAccessToken(apiConfig: ApiConfig) {
    let url = util.format(this.url, apiConfig.getCorpId, apiConfig.getAppScrect)
    let data = await HttpKit.getHttpDelegate.httpGet(url)
    if (data) {
      let accessToken: AccessToken = new AccessToken(data)
      let accessTokenCache: IAccessTokenCache = QyApiConfigKit.getAccessTokenCache
      accessTokenCache.set(apiConfig.getAppId.concat(this.SEPARATOR).concat(apiConfig.getCorpId), accessToken.getCacheJson)
      return accessToken
    } else {
      throw new Error('获取 accessToken 异常')
    }
  }
}