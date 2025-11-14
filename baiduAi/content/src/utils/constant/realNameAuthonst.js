// 实名认证

//人工审核是否进行处理
export const APPROVE_NO_DEAL = 0 //未处理(人工审核中）manualApproveStatus
export const APPROVE_DEAL = 1 //已处理(人工审核失败/人工审核通过 ) manualApproveStatus

//人工审核状态
export const REAL_NAME_NOT_DEAL_OR_FAIL = 0 //未实名认证(审核失败) isCertificated
export const REAL_NAME_PASS = 1 //实名认证通过 isCertificated

export const PERSONA_CERTIFICATE_TYPE = 1 //个人用户
export const ENTERPRISE_CERTIFICATE_TYPE = 2 //企业用户

export const SYSTEM_APPROVETYPE_TYPE = 1 //系统审核
export const ARTIFICIAL_APPROVETYPE_TYPE = 2 //人工审核

//组合 是否进行人工审核 人工审核状态
export const NO_REAL_NAME = 0 //未实名认证
export const REAL_NAME_FAIL = 1 //系统实名认证失败
export const REAL_NAME_SUCCSS = 2 //系统实名认证成功
export const SYSTEM_PERSONAL_REAL_NAME_FAIL = 3 //系统个人认证失败
export const SYSTEM_PERSONAL_REAL_NAME_SUCCESS = 4 //系统个人认证成功
export const SYSTEM_ENTERPRISE_REAL_NAME_FAIL = 5 //系统企业认证失败
export const SYSTEM_ENTERPRISE_REAL_NAME_SUCCESS = 6 //系统企业认证成功
export const ARTIFICIA_WAIT_ENTERPRISE_REAL_NAME = 7 //企业人工审核中
export const ARTIFICIAL_ENTERPRISE_REAL_NAME_FAIL = 8 //企业人工审核失败
export const ARTIFICIA_ENTERPRISE_REAL_NAME_SUCCESS = 9 //企业人工审核成功

/**
 * @description:审核状态与
 * manualApproveStatus 人工审核处理状态：  0-未处理(人工审核中)、1-已处理(人工审核失败/人工审核通过 )
 * isCertificated 实名认证状态  0-未实名认证(审核失败)； 1-实名认证(审核成功
 * certificateType 实名认证类型  1-个人用户 2-企业用户
 * approveType  审核方式  1-系统自动审核； 2-人工审核
 * manualApproveOpinion  人工审核认证失败原因,审核意见/拒绝理由
 * certificateFailReason 系统认证错误信息
 *
 * @param {Objecy} row
 * @return {Number | String}
 */
export function REAL_NAME_STATUS(row) {
  const { manualApproveStatus, isCertificated } = row
  //未处理
  if (manualApproveStatus == APPROVE_NO_DEAL) {
    if (isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL) {
      return NO_REAL_NAME
    }
  }
  //已处理
  else if (manualApproveStatus == APPROVE_DEAL) {
    if (isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL) {
      return REAL_NAME_FAIL
    } else if (isCertificated == REAL_NAME_PASS) {
      return REAL_NAME_SUCCSS
    }
  }
  return NO_REAL_NAME
}

export function NOT_REAL_NAME(row) {
  const status = REAL_NAME_STATUS_CERTIFICATE_TYPE(row)
  return [
    NO_REAL_NAME,
    SYSTEM_PERSONAL_REAL_NAME_FAIL,
    SYSTEM_ENTERPRISE_REAL_NAME_FAIL,
    ARTIFICIAL_ENTERPRISE_REAL_NAME_FAIL
  ].includes(status)
}

/**
 * @description:审核状态与manualApproveStatus和isCertificated和certificateType有关 获取审核状态状态
 * @param {Object} row
 * @return {Number | String}
 */
export function REAL_NAME_STATUS_CERTIFICATE_TYPE(row) {
  //approveType处理方式
  //isCertificated  实名认证状态  0-未实名认证(审核失败)； 1-实名认证(审核成功
  
  //row 为null 时候是未实名认证
  if(!row) {
    return NO_REAL_NAME
  }

  const {
    manualApproveStatus,
    isCertificated,
    certificateType,
    approveType,
    manualApproveOpinion,
    certificateFailReason
  } = row

  //未处理
  if (
    manualApproveStatus == APPROVE_NO_DEAL &&
    isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL &&
    manualApproveOpinion == APPROVE_NO_DEAL &&
    !certificateFailReason
  ) {
    return NO_REAL_NAME
  }

  //======== 系统审核 =========

  //个人用户
  else if (approveType == SYSTEM_APPROVETYPE_TYPE) {
    //未实名认证
    if (certificateType == PERSONA_CERTIFICATE_TYPE) {
      //个人实名认证失败
      if (isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL) {
        return SYSTEM_PERSONAL_REAL_NAME_FAIL
      } else {
        //个人实名认证成功
        return SYSTEM_PERSONAL_REAL_NAME_SUCCESS
      }
    }

    //企业用户
    else {
      //企业实名认证失败
      if (isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL) {
        console.log('join')
        return SYSTEM_ENTERPRISE_REAL_NAME_FAIL
      } else {
        //企业实名认证成功
        return SYSTEM_ENTERPRISE_REAL_NAME_SUCCESS
      }
    }
  }

  //人工审核
  else if (approveType == ARTIFICIAL_APPROVETYPE_TYPE) {
    //企业实名认证未处理
    if (manualApproveStatus == APPROVE_NO_DEAL) {
      return ARTIFICIA_WAIT_ENTERPRISE_REAL_NAME //企业人工审核中
    }
    //企业实名认证已经处理
    else {
      //企业实名认证失败
      if (isCertificated == REAL_NAME_NOT_DEAL_OR_FAIL) {
        return ARTIFICIAL_ENTERPRISE_REAL_NAME_FAIL //企业人工审核失败
      }
      //企业实名认证成功
      else {
        return ARTIFICIA_ENTERPRISE_REAL_NAME_SUCCESS //企业人工审核成功
      }
    }
  }

  return NO_REAL_NAME
}
