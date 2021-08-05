const lang = [
  {
    key: "测试",
    en: "测试",
    zh: "测试",
    es: "测试",
    ja: "测试"
  },
  {
    key: "name",
    en: "Name",
    zh: "名称"
  },
  // node | 节点
  {
    key: "node_name",
    en: "Name",
    zh: "名称"
  },
  {
    key: "node_default_ip",
    en: "Default IP",
    zh: "默认IP"
  },
  {
    key: "node_default_port",
    en: "Default Port",
    zh: "默认TCP端口"
  },
  {
    key: "uuid",
    en: "UUID",
    zh: "UUID"
  },
  {
    key: "node_status",
    en: "status",
    zh: "连接状态"
  },
  {
    key: "delete",
    en: "Delete",
    zh: "删除"
  },
  {
    key: "lost",
    en: "Lost",
    zh: "强删"
  },
  {
    key: "reconnect",
    en: "Reconnect",
    zh: "重连"
  },
  {
    key: "delete_confirm",
    en: "Confirm?",
    zh: "确定删除吗？"
  },
  {
    key: "edit",
    en: "Edit",
    zh: "编辑"
  },
  {
    key: "create",
    en: "Create",
    zh: "创建"
  },
  {
    key: "success",
    zh: "成功",
    en: "Success"
  },
  {
    key: "added_successfully",
    zh: "添加成功",
    en: "Added successfully"
  },
  {
    key: "reconnected_successfully",
    zh: "重连成功",
    en: "Reconnected successfully"
  },
  {
    key: "deleted_successfully",
    zh: "删除成功",
    en: "Deleted successfully"
  },
  {
    key: "lost_successfully",
    zh: "强制删除成功",
    en: "Lost successfully"
  },
  // sp | 存储池
  {
    key: "sp_name",
    en: "Name",
    zh: "名称"
  },
  {
    key: "sp_node",
    en: "Node",
    zh: "节点"
  },
  {
    key: "sp_disk",
    en: "Disk",
    zh: "磁盘"
  },
  {
    key: "sp_type",
    en: "Type",
    zh: "类型"
  },
  {
    key: "sp_capacity",
    en: "Capacity",
    zh: "容量"
  },
  {
    key: "sp_mgr",
    en: "MGR",
    zh: "MGR"
  },
  {
    key: "sp_snapshot",
    en: "Snapshot",
    zh: "支持快照"
  },
  {
    key: "sp_not_supports_snapshots",
    en: "Support",
    zh: "支持"
  },
  {
    key: "sp_not_supports_snapshots",
    en: "Not Support",
    zh: "不支持"
  },
  {
    key: "sp_capacity_total",
    en: "Total:",
    zh: "共"
  },
  {
    key: "sp_free_capacity",
    en: "Free:",
    zh: "可用"
  },
  {
    key: "sp_ip_alias",
    en: "IP Alias",
    zh: "IP别名"
  },
  {
    key: "node",
    en: "Node",
    zh: "节点"
  },
  {
    key: "type",
    en: "Type",
    zh: "类型"
  },
  {
    key: "batch_delete",
    en: "Delete",
    zh: "批量删除"
  },
  {
    key: "batch_lost",
    en: "Lost",
    zh: "批量强删"
  },
  {
    key: "vg_name",
    en: "Storage driver name",
    zh: "存储驱动名"
  },
  {
    key: "net_work_name",
    en: "Alias",
    zh: "IP别名"
  },
  {
    key: "net_work_address",
    en: "IP Address",
    zh: "IP地址"
  },
  {
    key: "net_work_port",
    en: "TCP Port",
    zh: "TCP端口"
  },
  {
    key: "net_work_preference",
    en: "Network Preference",
    zh: "优先网络"
  },
  {
    key: "net_work_preference_unset",
    en: "Network Preference Unset",
    zh: "未设置"
  },
  {
    key: "端口范围在1~65534",
    en: "The port range is 1~65534",
    zh: "端口范围在 1~65534"
  },
  {
    key: "yes",
    en: "Yes",
    zh: "是"
  },
  {
    key: "no",
    en: "No",
    zh: "否"
  },
  {
    key: "no_info",
    en: "No Info",
    zh: "信息不可用"
  },
  {
    key: "network_management",
    en: "Management Network",
    zh: "管理网络"
  },
  {
    key: "rg_name",
    en: "RG Name",
    zh: "名称"
  },
  {
    key: "rd_rg_name",
    en: "RG Name",
    zh: "组"
  },
  {
    key: "rg_desc",
    en: "Desc",
    zh: "描述"
  },
  {
    key: "rg_size",
    en: "Size",
    zh: "容量"
  },
  {
    key: "async",
    en: "Asynchronous",
    zh: "异步"
  },
  {
    key: "sync",
    en: "Synchronous",
    zh: "同步"
  },
  {
    key: "description",
    en: "Description",
    zh: "描述"
  },
  {
    key: "sp_name_list",
    en: "Storage Pool",
    zh: "优先存储池"
  },
  {
    key: "vg_sp",
    en: "StoragePool(s)",
    zh: "存储池"
  },
  {
    key: "data_copy_mode",
    en: "Replication",
    zh: "数据复制模式"
  },
  {
    key: "place_count",
    en: "Place Count",
    zh: "自动分配副本数"
  },
  {
    key: "diskless",
    en: "Diskless",
    zh: "无盘模式"
  },
  {
    key: "one_key_deploy",
    en: "Deploy",
    zh: "一键部署"
  },
  {
    key: "rd_size",
    en: "Size",
    zh: "容量"
  },
  {
    key: "rd_port",
    en: "Port",
    zh: "端口"
  },
  {
    key: "rd_state",
    en: "State",
    zh: "状态"
  },
  {
    key: "resource_group_name",
    en: "Resource Group Name",
    zh: "组"
  },
  {
    key: "resource_name",
    en: "Resource Name",
    zh: "资源名称"
  },
  {
    key: "resource_node",
    en: "Resource Node",
    zh: "节点"
  },
  {
    key: "resource_port",
    en: "Resource Port",
    zh: "端口"
  },
  {
    key: "resource_usage",
    en: "Resource Usage",
    zh: "使用状况"
  },
  {
    key: "resource_state",
    en: "Resource State",
    zh: "状态"
  },
  {
    key: "resource_conns",
    en: "Resource Conn",
    zh: "连接状态"
  },
  {
    key: "resource_created_on",
    en: "Resource CreatedOn",
    zh: "创建时间"
  },
  {
    key: "rd_name",
    en: "RD Name",
    zh: "配置管理名称"
  },
  {
    key: "volume_size",
    en: "Volume Size",
    zh: "卷容量"
  },
  {
    key: "definition_only",
    en: "Definition Only",
    zh: "仅创建配置"
  },
  {
    key: "volume_resource_name",
    en: "Resource",
    zh: "资源"
  },
  {
    key: "volume_node",
    en: "Node",
    zh: "节点"
  },
  {
    key: "volume_sp_name",
    en: "StoragePool",
    zh: "存储池"
  },
  {
    key: "volume_device_name",
    en: "DeviceName",
    zh: "设备名称"
  },
  {
    key: "volume_allocated",
    en: "Allocated",
    zh: "已分配"
  },
  {
    key: "volume_inuse",
    en: "In Use",
    zh: "使用状态"
  },
  {
    key: "volume_state",
    en: "State",
    zh: "状态"
  },
  {
    key: "volume_size_range",
    en: "The input range is 4 KB~1099511627776 KB",
    zh: "输入范围在4KB~1099511627776KB"
  },
  {
    key: "name_required",
    en: "Name is required",
    zh: "名称是必须的"
  },
  {
    key: "is_required",
    en: "This field is required",
    zh: "这个字段是必须的"
  },
  {
    key: "please_select",
    en: "Please Select",
    zh: "请选择"
  },
  {
    key: "activate",
    en: "Activate",
    zh: "运行"
  },
  {
    key: "deactivate",
    en: "Deactivate",
    zh: "暂停"
  },
  {
    key: "none",
    en: "None",
    zh: "无"
  },
  {
    key: "cancel",
    en: "Cancel",
    zh: "取消"
  },
  {
    key: "device_name",
    en: "Device Name",
    zh: "磁盘名称"
  },
  {
    key: "capacity",
    en: "Capacity",
    zh: "磁盘容量"
  },
  {
    key: "mount_point",
    en: "Mount Point",
    zh: "挂载点"
  },
  {
    key: "clients",
    en: "Clients",
    zh: "客户端"
  },
  {
    key: "parameters",
    en: "Parameters",
    zh: "参数"
  },
  {
    key: "allocate_method",
    en: "Allocate Method",
    zh: "分配方式"
  },
  {
    key: "manual",
    en: "Manual",
    zh: "手动"
  },
  {
    key: "auto",
    en: "Auto",
    zh: "自动"
  },
  {
    key: "auto_place",
    en: "Auto Place Number",
    zh: "数据副本数"
  },
  {
    key: "updated_successfully",
    en: "Updated Successfully",
    zh: "更新成功"
  },
  {
    key: "Request failed {code} \n {msg} ",
    en: "Request failed {code} \n {msg} ",
    zh: "请求失败 {code} \n {msg} "
  },
  {
    key: "Request failed {msg} \n {details}",
    en: "Request failed {msg} \n {details} ",
    zh: "请求失败 {msg} \n {details}"
  },
  {
    key: "change_pass",
    en: "Change Password",
    zh: "更改密码"
  },
  {
    key: "password",
    en: "Password",
    zh: "密码"
  },
  {
    key: "status",
    en: "Status",
    zh: "状态"
  },
  {
    key: "email",
    en: "Email",
    zh: "邮箱"
  },
  {
    key: "role",
    en: "Permissions",
    zh: "权限"
  },
  {
    key: "updated_time",
    en: "Updated Time",
    zh: "更新时间"
  },
  {
    key: "Account",
    en: "Account",
    zh: "账户"
  },
  {
    key: "Update",
    en: "Update",
    zh: "更新"
  },
  {
    key: "error_time",
    en: "Error Time",
    zh: "错误时间"
  },
  {
    key: "filename",
    en: "Filename",
    zh: "文件名称"
  },
  {
    key: "module",
    en: "Module",
    zh: "模块"
  },
  {
    key: "exception_message",
    en: "Exception Message",
    zh: "异常信息"
  },
  {
    key: "detail",
    en: "Detail",
    zh: "详情"
  },
  {
    key: "log_detail",
    en: "Log Detail",
    zh: "日志详情"
  },
  {
    key: "node_num",
    en: "Nodes",
    zh: "节点数"
  },
  {
    key: "resource_num",
    en: "Resources",
    zh: "资源"
  },
  {
    key: "volume_num",
    en: "Volumes",
    zh: "卷"
  },
  {
    key: "error_num",
    en: "Error Reports",
    zh: "错误"
  },
  {
    key: "resource",
    en: "Resource",
    zh: "资源"
  },
  {
    key: "volume",
    en: "Volume",
    zh: "卷"
  },
  {
    key: "sp",
    en: "Storage Pool",
    zh: "存储池"
  },

  {
    key: "OFFLINE",
    en: "OFFLINE",
    zh: "离线"
  },
  {
    key: "CONNECTED",
    en: "CONNECTED",
    zh: "连接的"
  },
  {
    key: "ONLINE",
    en: "ONLINE",
    zh: "线上"
  },
  {
    key: "VERSION_MISMATCH",
    en: "VERSION_MISMATCH",
    zh: "版本不匹配"
  },
  {
    key: "FULL_SYNC_FAILED",
    en: "FULL_SYNC_FAILED",
    zh: "完全同步失败"
  },
  {
    key: "AUTHENTICATION_ERROR",
    en: "AUTHENTICATION_ERROR",
    zh: "授权错误"
  },
  {
    key: "UNKNOWN",
    en: "UNKNOWN",
    zh: "未知"
  },
  {
    key: "HOSTNAME_MISMATCH",
    en: "HOSTNAME_MISMATCH",
    zh: "主机名不匹配"
  },
  {
    key: "OTHER_CONTROLLER",
    en: "OTHER_CONTROLLER",
    zh: "其他控制器"
  },
  {
    key: "AUTHENTICATED",
    en: "AUTHENTICATED",
    zh: "认证的"
  },
  {
    key: "NO_STLT_CONN",
    en: "NO_STLT_CONN",
    zh: "没有连接"
  },

  {
    key: "secondary",
    en: "secondary",
    zh: "次要的"
  },
  {
    key: "unknown state",
    en: "unknown state",
    zh: "未知状态"
  },
  {
    key: "primary",
    en: "primary",
    zh: "主"
  },
  {
    key: "UpToDate",
    en: "UpToDate",
    zh: "最新"
  },
  {
    key: "Created",
    en: "Created",
    zh: "已建立"
  },
  {
    key: "Attached",
    en: "Attached",
    zh: "附上"
  },
  {
    key: "Diskless",
    en: "Diskless",
    zh: "无盘"
  },
  {
    key: "Inconsistent",
    en: "Inconsistent",
    zh: "前后不一致"
  },
  {
    key: "Failed",
    en: "Failed",
    zh: "失败的"
  },
  {
    key: "To: Creating",
    en: "To: Creating",
    zh: "到：创建"
  },
  {
    key: "To: Attachable",
    en: "To: Attachable",
    zh: "至：可附加"
  },
  {
    key: "To: Attaching",
    en: "To: Attaching",
    zh: "至：附加"
  },
  {
    key: "Diskless(Detached)",
    en: "Diskless(Detached)",
    zh: "无盘（独立）"
  },
  {
    key: "DUnknown",
    en: "DUnknown",
    zh: "D未知"
  },
  {
    key: "InUse",
    en: "InUse",
    zh: "正在使用"
  },
  {
    key: "Unused",
    en: "Unused",
    zh: "没使用"
  },
  {
    key: "OK",
    en: "OK",
    zh: "正常"
  },
  {
    key: "disk_creation_record",
    en: "Disk creation records",
    zh: "磁盘创建记录"
  },
  {
    key: "storage_pool_error_statistics",
    en: "Storage pool error statistics",
    zh: "存储池错误统计"
  },
  {
    key: "prop_editor",
    en: "Property Editor",
    zh: "属性编辑器"
  },
  {
    key: "select_editor",
    en: "Select Property",
    zh: "选择属性"
  },
  {
    key: "properties",
    en: "Properties...",
    zh: "属性"
  },
  {
    key: "controller",
    en: "Controller",
    zh: "Controller"
  },
  {
    key: "controller_ip",
    en: "Binding IP",
    zh: "Controller Ip"
  },
  {
    key: "controller_host",
    en: "Active on",
    zh: "Active on"
  },
  {
    key: "delete_all_props",
    zh: "删除所有属性",
    en: "Delete All Properties"
  },
  {
    key: "add_prop",
    zh: "增加属性",
    en: "Add Property"
  },
  {
    key: "aux_prop",
    zh: "增加自定义属性",
    en: "Add Auxiliary Property"
  },
  {
    key: "reset_props",
    zh: "确定重置属性吗？",
    en: "Are you sure to reset all properties?"
  },
  {
    key: "modified_successfully",
    zh: "修改成功",
    en: "Successfully modified"
  },
  {
    key: "yes",
    zh: "确定",
    en: "Yes"
  },
  {
    key: "no",
    zh: "取消",
    en: "No"
  },
  {
    key: "restore",
    zh: "恢复",
    en: "Restore"
  },
  {
    key: "layers",
    zh: "存储层",
    en: "Layers"
  },
  {
    key: "providers",
    zh: "Providers",
    en: "Providers"
  },
  {
    key: "replicas_on_same",
    zh: "Replicas On Same",
    en: "Replicas On Same"
  },
  {
    key: "replicas_on_different",
    zh: "Replicas On Different",
    en: "Replicas On Different"
  },
  {
    key: "do_not_place_with",
    zh: "Do Not Place With",
    en: "Do Not Place With"
  },
  {
    key: "do_not_place_with_rege",
    zh: "Do Not Place With Rege",
    en: "Do Not Place With Rege"
  },
  {
    key: "enable",
    zh: "启用",
    en: "Enable"
  },
  {
    key: "disable",
    zh: "禁用",
    en: "Disable"
  },
  {
    key: "systemError",
    zh: "服务器异常,请联系管理员",
    en: "The server is abnormal, please contact the administrator"
  }
]

const langJson = {
  en: {},
  zh: {},
  es: {},
  ja: {}
}

lang.forEach(item => {
  for (const key in langJson) {
    langJson[key][item.key] = item[key] || item.key
  }
})

export default langJson
