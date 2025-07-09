import re
import logging
from typing import Dict, Any, List, Union, Tuple

# 配置日志
logger = logging.getLogger(__name__)

class ConfigValidator:
    """Homepage 配置验证器"""
    
    def __init__(self):
        # 支持的主题
        self.valid_themes = ['light', 'dark']
        
        # 支持的颜色
        self.valid_colors = [
            'slate', 'gray', 'zinc', 'neutral', 'stone', 'amber', 'yellow',
            'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
            'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'red', 'white'
        ]
        
        # 支持的页眉样式
        self.valid_header_styles = ['underlined', 'boxed', 'clean', 'boxedWidgets']
        
        # 支持的图标样式
        self.valid_icon_styles = ['gradient', 'theme']
        
        # 支持的状态样式
        self.valid_status_styles = ['', 'dot', 'basic']
        
        # 支持的链接目标
        self.valid_targets = ['_self', '_blank', '_top']
        
        # 支持的语言
        self.valid_languages = [
            'ca', 'de', 'en', 'es', 'fr', 'he', 'hr', 'hu', 'it', 
            'nb-NO', 'nl', 'pt', 'ru', 'sv', 'vi', 'zh-CN', 'zh-Hant'
        ]
    
    def validate_settings(self, settings: Dict[str, Any]) -> Tuple[bool, str]:
        """验证全局设置，返回(验证结果, 错误信息)"""
        try:
            logger.info(f"Validating settings with {len(settings)} keys")
            
            # 验证主题
            if 'theme' in settings and settings['theme'] not in self.valid_themes:
                error_msg = f"无效的主题设置: {settings['theme']}，支持的主题: {', '.join(self.valid_themes)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证颜色
            if 'color' in settings and settings['color'] not in self.valid_colors:
                error_msg = f"无效的颜色设置: {settings['color']}，支持的颜色: {', '.join(self.valid_colors)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证页眉样式
            if 'headerStyle' in settings and settings['headerStyle'] not in self.valid_header_styles:
                error_msg = f"无效的页眉样式: {settings['headerStyle']}，支持的样式: {', '.join(self.valid_header_styles)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证图标样式
            if 'iconStyle' in settings and settings['iconStyle'] not in self.valid_icon_styles:
                error_msg = f"无效的图标样式: {settings['iconStyle']}，支持的样式: {', '.join(self.valid_icon_styles)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证状态样式
            if 'statusStyle' in settings and settings['statusStyle'] not in self.valid_status_styles:
                error_msg = f"无效的状态样式: {settings['statusStyle']}，支持的样式: {', '.join(self.valid_status_styles)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证链接目标
            if 'target' in settings and settings['target'] not in self.valid_targets:
                error_msg = f"无效的链接目标: {settings['target']}，支持的目标: {', '.join(self.valid_targets)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证语言
            if 'language' in settings and settings['language'] not in self.valid_languages:
                error_msg = f"无效的语言设置: {settings['language']}，支持的语言: {', '.join(self.valid_languages)}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证布尔值
            bool_fields = ['hideVersion', 'showStats', 'useEqualHeights', 'fiveColumns', 
                          'disableCollapse', 'groupsInitiallyCollapsed']
            for field in bool_fields:
                if field in settings and not isinstance(settings[field], bool):
                    error_msg = f"字段 {field} 必须是布尔值，当前值: {settings[field]} ({type(settings[field]).__name__})"
                    logger.warning(error_msg)
                    return False, error_msg
            
            # 验证 URL 格式
            if 'startUrl' in settings:
                if not self._validate_url(settings['startUrl']):
                    error_msg = f"无效的起始URL格式: {settings['startUrl']}"
                    logger.warning(error_msg)
                    return False, error_msg
            
            if 'base' in settings:
                if not self._validate_url(settings['base']):
                    error_msg = f"无效的基础URL格式: {settings['base']}"
                    logger.warning(error_msg)
                    return False, error_msg
            
            # 验证 favicon URL
            if 'favicon' in settings and settings['favicon']:
                if not self._validate_url(settings['favicon']):
                    error_msg = f"无效的favicon URL格式: {settings['favicon']}"
                    logger.warning(error_msg)
                    return False, error_msg
            
            logger.info("Settings validation passed")
            return True, "验证通过"
            
        except Exception as e:
            error_msg = f"设置验证异常: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def validate_bookmarks(self, bookmarks: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """验证书签配置，返回(验证结果, 错误信息)"""
        try:
            logger.info(f"Validating bookmarks with {len(bookmarks) if isinstance(bookmarks, list) else 'N/A'} groups")
            
            if not isinstance(bookmarks, list):
                error_msg = f"书签配置必须是列表格式，当前类型: {type(bookmarks).__name__}"
                logger.warning(error_msg)
                return False, error_msg
            
            for group_index, group in enumerate(bookmarks):
                if not isinstance(group, dict):
                    error_msg = f"书签分组 #{group_index + 1} 必须是字典格式，当前类型: {type(group).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 每个组应该只有一个键
                if len(group) != 1:
                    error_msg = f"书签分组 #{group_index + 1} 应该只包含一个分组名称，当前包含 {len(group)} 个键"
                    logger.warning(error_msg)
                    return False, error_msg
                
                group_name = list(group.keys())[0]
                group_items = group[group_name]
                
                if not isinstance(group_items, list):
                    error_msg = f"书签分组 '{group_name}' 的内容必须是列表格式，当前类型: {type(group_items).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证每个书签项
                for item_index, item in enumerate(group_items):
                    if not isinstance(item, dict):
                        error_msg = f"分组 '{group_name}' 中的书签 #{item_index + 1} 必须是字典格式，当前类型: {type(item).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 每个书签项应该只有一个键
                    if len(item) != 1:
                        error_msg = f"分组 '{group_name}' 中的书签 #{item_index + 1} 应该只包含一个书签名称，当前包含 {len(item)} 个键"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    bookmark_name = list(item.keys())[0]
                    bookmark_config = item[bookmark_name]
                    
                    # 书签配置应该是一个列表，包含配置字典
                    if not isinstance(bookmark_config, list):
                        error_msg = f"书签 '{bookmark_name}' 的配置必须是列表格式，当前类型: {type(bookmark_config).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 列表不能为空
                    if not bookmark_config:
                        error_msg = f"书签 '{bookmark_name}' 的配置列表不能为空"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证配置列表中的每个配置项
                    for config_index, config_item in enumerate(bookmark_config):
                        if not isinstance(config_item, dict):
                            error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} 必须是字典格式，当前类型: {type(config_item).__name__}"
                            logger.warning(error_msg)
                            return False, error_msg
                        
                        # 验证必需字段
                        if 'href' not in config_item:
                            error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} 缺少必需的 'href' 字段"
                            logger.warning(error_msg)
                            return False, error_msg
                        
                        # 验证 URL
                        if not self._validate_url(config_item['href']):
                            error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} URL格式无效: {config_item['href']}"
                            logger.warning(error_msg)
                            return False, error_msg
                        
                        # 验证可选字段
                        if 'abbr' in config_item:
                            if not isinstance(config_item['abbr'], str):
                                error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} abbr 必须是字符串，当前类型: {type(config_item['abbr']).__name__}"
                                logger.warning(error_msg)
                                return False, error_msg
                            if len(config_item['abbr']) > 2:
                                error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} 缩写长度不能超过2个字符，当前: {config_item['abbr']}"
                                logger.warning(error_msg)
                                return False, error_msg
                        
                        # 验证其他可选字段
                        if 'description' in config_item and not isinstance(config_item['description'], str):
                            error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} description 必须是字符串，当前类型: {type(config_item['description']).__name__}"
                            logger.warning(error_msg)
                            return False, error_msg
                        
                        if 'icon' in config_item and not isinstance(config_item['icon'], str):
                            error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} icon 必须是字符串，当前类型: {type(config_item['icon']).__name__}"
                            logger.warning(error_msg)
                            return False, error_msg
                        
                        # 验证链接目标
                        if 'target' in config_item:
                            if config_item['target'] not in self.valid_targets:
                                error_msg = f"书签 '{bookmark_name}' 的配置项 #{config_index + 1} 链接目标无效: {config_item['target']}，支持的目标: {', '.join(self.valid_targets)}"
                                logger.warning(error_msg)
                                return False, error_msg
            
            logger.info("Bookmarks validation passed")
            return True, "验证通过"
            
        except Exception as e:
            error_msg = f"书签验证异常: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def validate_services(self, services: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """验证服务配置，返回(验证结果, 错误信息)"""
        try:
            logger.info(f"Validating services with {len(services) if isinstance(services, list) else 'N/A'} groups")
            
            if not isinstance(services, list):
                error_msg = f"服务配置必须是列表格式，当前类型: {type(services).__name__}"
                logger.warning(error_msg)
                return False, error_msg
            
            for group_index, group in enumerate(services):
                if not isinstance(group, dict):
                    error_msg = f"服务分组 #{group_index + 1} 必须是字典格式，当前类型: {type(group).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 每个组应该只有一个键
                if len(group) != 1:
                    error_msg = f"服务分组 #{group_index + 1} 应该只包含一个分组名称，当前包含 {len(group)} 个键"
                    logger.warning(error_msg)
                    return False, error_msg
                
                group_name = list(group.keys())[0]
                group_items = group[group_name]
                
                if not isinstance(group_items, list):
                    error_msg = f"服务分组 '{group_name}' 的内容必须是列表格式，当前类型: {type(group_items).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证每个服务项
                for item_index, item in enumerate(group_items):
                    if not isinstance(item, dict):
                        error_msg = f"分组 '{group_name}' 中的服务 #{item_index + 1} 必须是字典格式，当前类型: {type(item).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 每个服务项应该只有一个键
                    if len(item) != 1:
                        error_msg = f"分组 '{group_name}' 中的服务 #{item_index + 1} 应该只包含一个服务名称，当前包含 {len(item)} 个键"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    service_name = list(item.keys())[0]
                    service_data = item[service_name]
                    
                    if not isinstance(service_data, dict):
                        error_msg = f"服务 '{service_name}' 的配置必须是字典格式，当前类型: {type(service_data).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证必需字段
                    if 'href' not in service_data:
                        error_msg = f"服务 '{service_name}' 缺少必需的 'href' 字段"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证 URL
                    if not self._validate_url(service_data['href']):
                        error_msg = f"服务 '{service_name}' 的URL格式无效: {service_data['href']}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证可选的 URL 字段
                    url_fields = ['siteMonitor', 'ping']
                    for field in url_fields:
                        if field in service_data and service_data[field]:
                            if not self._validate_url(service_data[field]):
                                error_msg = f"服务 '{service_name}' 的 {field} URL格式无效: {service_data[field]}"
                                logger.warning(error_msg)
                                return False, error_msg
                    
                    # 验证状态样式
                    if 'statusStyle' in service_data:
                        if service_data['statusStyle'] not in self.valid_status_styles:
                            error_msg = f"服务 '{service_name}' 的状态样式无效: {service_data['statusStyle']}，支持的样式: {', '.join(self.valid_status_styles)}"
                            logger.warning(error_msg)
                            return False, error_msg
                    
                    # 验证链接目标
                    if 'target' in service_data:
                        if service_data['target'] not in self.valid_targets:
                            error_msg = f"服务 '{service_name}' 的链接目标无效: {service_data['target']}，支持的目标: {', '.join(self.valid_targets)}"
                            logger.warning(error_msg)
                            return False, error_msg
                    
                    # 验证布尔值
                    if 'showStats' in service_data:
                        if not isinstance(service_data['showStats'], bool):
                            error_msg = f"服务 '{service_name}' 的 showStats 必须是布尔值，当前值: {service_data['showStats']} ({type(service_data['showStats']).__name__})"
                            logger.warning(error_msg)
                            return False, error_msg
            
            logger.info("Services validation passed")
            return True, "验证通过"
            
        except Exception as e:
            error_msg = f"服务验证异常: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def validate_widgets(self, widgets: Dict[str, Any]) -> Tuple[bool, str]:
        """验证小工具配置，返回(验证结果, 错误信息)"""
        try:
            logger.info(f"Validating widgets with {len(widgets) if isinstance(widgets, dict) else 'N/A'} items")
            
            if not isinstance(widgets, dict):
                error_msg = f"小工具配置必须是字典格式，当前类型: {type(widgets).__name__}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 支持的小工具类型
            supported_types = [
                'healthchecks', 'uptimekuma', 'ping', 'portainer',
                'plex', 'jellyfin', 'emby', 'sonarr', 'adguard', 
                'pihole', 'customapi', 'opnsense'
            ]
            
            for widget_name, widget_config in widgets.items():
                if not isinstance(widget_config, dict):
                    error_msg = f"小工具 '{widget_name}' 的配置必须是字典格式，当前类型: {type(widget_config).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证必需字段
                if 'type' not in widget_config:
                    error_msg = f"小工具 '{widget_name}' 缺少必需的 'type' 字段"
                    logger.warning(error_msg)
                    return False, error_msg
                
                widget_type = widget_config['type']
                if widget_type not in supported_types:
                    error_msg = f"小工具 '{widget_name}' 的类型不支持: {widget_type}，支持的类型: {', '.join(supported_types)}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证 URL（必需）
                if 'url' not in widget_config:
                    error_msg = f"小工具 '{widget_name}' 缺少必需的 'url' 字段"
                    logger.warning(error_msg)
                    return False, error_msg
                
                if not self._validate_url(widget_config['url']):
                    error_msg = f"小工具 '{widget_name}' 的URL格式无效: {widget_config['url']}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证可选字段
                if 'refreshInterval' in widget_config:
                    interval = widget_config['refreshInterval']
                    if not isinstance(interval, int) or interval < 1000:
                        error_msg = f"小工具 '{widget_name}' 的刷新间隔必须是大于等于1000的整数，当前值: {interval}"
                        logger.warning(error_msg)
                        return False, error_msg
                
                # 验证字段配置
                if 'fields' in widget_config:
                    fields = widget_config['fields']
                    if not isinstance(fields, list):
                        error_msg = f"小工具 '{widget_name}' 的 fields 必须是列表格式，当前类型: {type(fields).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                
                # 验证自定义映射（仅限 customapi）
                if 'mappings' in widget_config:
                    if widget_type != 'customapi':
                        error_msg = f"小工具 '{widget_name}' 的 mappings 字段只能用于 customapi 类型，当前类型: {widget_type}"
                        logger.warning(error_msg)
                        return False, error_msg
                    mappings = widget_config['mappings']
                    if not isinstance(mappings, list):
                        error_msg = f"小工具 '{widget_name}' 的 mappings 必须是列表格式，当前类型: {type(mappings).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证映射结构
                    for mapping_index, mapping in enumerate(mappings):
                        if not isinstance(mapping, dict):
                            error_msg = f"小工具 '{widget_name}' 的 mapping #{mapping_index + 1} 必须是字典格式，当前类型: {type(mapping).__name__}"
                            logger.warning(error_msg)
                            return False, error_msg
                        if 'label' not in mapping or 'field' not in mapping:
                            error_msg = f"小工具 '{widget_name}' 的 mapping #{mapping_index + 1} 缺少必需的 'label' 或 'field' 字段"
                            logger.warning(error_msg)
                            return False, error_msg
            
            logger.info("Widgets validation passed")
            return True, "验证通过"
            
        except Exception as e:
            error_msg = f"小工具验证异常: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def validate_docker(self, docker_config: Dict[str, Any]) -> Tuple[bool, str]:
        """验证 Docker 配置，返回(验证结果, 错误信息)"""
        try:
            logger.info(f"Validating docker config with {len(docker_config) if isinstance(docker_config, dict) else 'N/A'} instances")
            
            if not isinstance(docker_config, dict):
                error_msg = f"Docker配置必须是字典格式，当前类型: {type(docker_config).__name__}"
                logger.warning(error_msg)
                return False, error_msg
            
            # 验证每个 Docker 实例配置
            for instance_name, config in docker_config.items():
                if not isinstance(config, dict):
                    error_msg = f"Docker实例 '{instance_name}' 的配置必须是字典格式，当前类型: {type(config).__name__}"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 验证连接配置 - 必须有 socket 或 host
                has_socket = 'socket' in config and config['socket']
                has_host = 'host' in config and config['host']
                
                if not (has_socket or has_host):
                    error_msg = f"Docker实例 '{instance_name}' 必须配置 'socket' 或 'host' 连接方式"
                    logger.warning(error_msg)
                    return False, error_msg
                
                # 如果使用 host，验证格式
                if has_host:
                    host = config['host']
                    if not isinstance(host, str) or not host.strip():
                        error_msg = f"Docker实例 '{instance_name}' 的 host 必须是非空字符串，当前值: {host}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证端口（如果存在）
                    if 'port' in config:
                        port = config['port']
                        if not isinstance(port, int) or port < 1 or port > 65535:
                            error_msg = f"Docker实例 '{instance_name}' 的端口必须是1-65535之间的整数，当前值: {port}"
                            logger.warning(error_msg)
                            return False, error_msg
                
                # 验证 socket 路径
                if has_socket:
                    socket_path = config['socket']
                    if not isinstance(socket_path, str) or not socket_path.strip():
                        error_msg = f"Docker实例 '{instance_name}' 的 socket 必须是非空字符串，当前值: {socket_path}"
                        logger.warning(error_msg)
                        return False, error_msg
                
                # 验证布尔值字段
                bool_fields = ['showStats', 'swarm']
                for field in bool_fields:
                    if field in config and not isinstance(config[field], bool):
                        error_msg = f"Docker实例 '{instance_name}' 的 {field} 必须是布尔值，当前值: {config[field]} ({type(config[field]).__name__})"
                        logger.warning(error_msg)
                        return False, error_msg
                
                # 验证字符串字段
                string_fields = ['username', 'password']
                for field in string_fields:
                    if field in config and not isinstance(config[field], str):
                        error_msg = f"Docker实例 '{instance_name}' 的 {field} 必须是字符串，当前类型: {type(config[field]).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                
                # 验证 TLS 配置
                if 'tls' in config:
                    tls_config = config['tls']
                    if not isinstance(tls_config, dict):
                        error_msg = f"Docker实例 '{instance_name}' 的 TLS 配置必须是字典格式，当前类型: {type(tls_config).__name__}"
                        logger.warning(error_msg)
                        return False, error_msg
                    
                    # 验证 TLS 相关字段
                    tls_bool_fields = ['skipVerify']
                    for field in tls_bool_fields:
                        if field in tls_config and not isinstance(tls_config[field], bool):
                            error_msg = f"Docker实例 '{instance_name}' 的 TLS {field} 必须是布尔值，当前值: {tls_config[field]} ({type(tls_config[field]).__name__})"
                            logger.warning(error_msg)
                            return False, error_msg
                    
                    tls_string_fields = ['cert', 'key', 'ca']
                    for field in tls_string_fields:
                        if field in tls_config and not isinstance(tls_config[field], str):
                            error_msg = f"Docker实例 '{instance_name}' 的 TLS {field} 必须是字符串，当前类型: {type(tls_config[field]).__name__}"
                            logger.warning(error_msg)
                            return False, error_msg
            
            logger.info("Docker validation passed")
            return True, "验证通过"
            
        except Exception as e:
            error_msg = f"Docker验证异常: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def _validate_url(self, url: str) -> bool:
        """验证 URL 格式"""
        if not url:
            return True  # 空 URL 可以接受
        
        # 基本的 URL 格式检查
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        # 也支持相对路径
        if url.startswith('/'):
            return True
        
        return bool(url_pattern.match(url))
    
    def _validate_icon(self, icon: str) -> bool:
        """验证图标格式"""
        if not icon:
            return True
        
        # 支持的图标格式
        # 1. 文件名 (如 sonarr.png)
        # 2. MDI 图标 (如 mdi-flask-outline)
        # 3. Simple Icons (如 si-github)
        # 4. selfh.st icons (如 sh-sonarr)
        # 5. 完整 URL
        
        # 文件名格式
        if re.match(r'^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|svg|webp)$', icon):
            return True
        
        # MDI 图标格式
        if re.match(r'^mdi-[a-zA-Z0-9_-]+(\-#[a-fA-F0-9]{6})?$', icon):
            return True
        
        # Simple Icons 格式
        if re.match(r'^si-[a-zA-Z0-9_-]+(\-#[a-fA-F0-9]{6})?$', icon):
            return True
        
        # selfh.st icons 格式
        if re.match(r'^sh-[a-zA-Z0-9_-]+(\.(svg|png|webp))?$', icon):
            return True
        
        # 完整 URL
        if self._validate_url(icon):
            return True
        
        # 本地图标路径
        if icon.startswith('/icons/'):
            return True
        
        return False 