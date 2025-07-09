import re
from typing import Dict, Any, List, Union

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
    
    def validate_settings(self, settings: Dict[str, Any]) -> bool:
        """验证全局设置"""
        try:
            # 验证主题
            if 'theme' in settings and settings['theme'] not in self.valid_themes:
                return False
            
            # 验证颜色
            if 'color' in settings and settings['color'] not in self.valid_colors:
                return False
            
            # 验证页眉样式
            if 'headerStyle' in settings and settings['headerStyle'] not in self.valid_header_styles:
                return False
            
            # 验证图标样式
            if 'iconStyle' in settings and settings['iconStyle'] not in self.valid_icon_styles:
                return False
            
            # 验证状态样式
            if 'statusStyle' in settings and settings['statusStyle'] not in self.valid_status_styles:
                return False
            
            # 验证链接目标
            if 'target' in settings and settings['target'] not in self.valid_targets:
                return False
            
            # 验证语言
            if 'language' in settings and settings['language'] not in self.valid_languages:
                return False
            
            # 验证布尔值
            bool_fields = ['hideVersion', 'showStats', 'useEqualHeights', 'fiveColumns', 
                          'disableCollapse', 'groupsInitiallyCollapsed']
            for field in bool_fields:
                if field in settings and not isinstance(settings[field], bool):
                    return False
            
            # 验证 URL 格式
            if 'startUrl' in settings:
                if not self._validate_url(settings['startUrl']):
                    return False
            
            if 'base' in settings:
                if not self._validate_url(settings['base']):
                    return False
            
            # 验证 favicon URL
            if 'favicon' in settings and settings['favicon']:
                if not self._validate_url(settings['favicon']):
                    return False
            
            return True
            
        except Exception as e:
            print(f"Settings validation error: {e}")
            return False
    
    def validate_bookmarks(self, bookmarks: List[Dict[str, Any]]) -> bool:
        """验证书签配置"""
        try:
            if not isinstance(bookmarks, list):
                return False
            
            for group in bookmarks:
                if not isinstance(group, dict):
                    return False
                
                # 每个组应该只有一个键
                if len(group) != 1:
                    return False
                
                group_name = list(group.keys())[0]
                group_items = group[group_name]
                
                if not isinstance(group_items, list):
                    return False
                
                # 验证每个书签项
                for item in group_items:
                    if not isinstance(item, dict):
                        return False
                    
                    # 每个书签项应该只有一个键
                    if len(item) != 1:
                        return False
                    
                    bookmark_name = list(item.keys())[0]
                    bookmark_data = item[bookmark_name]
                    
                    if not isinstance(bookmark_data, dict):
                        return False
                    
                    # 验证必需字段
                    if 'href' not in bookmark_data:
                        return False
                    
                    # 验证 URL
                    if not self._validate_url(bookmark_data['href']):
                        return False
                    
                    # 验证可选字段
                    if 'abbr' in bookmark_data and len(bookmark_data['abbr']) > 2:
                        return False
            
            return True
            
        except Exception as e:
            print(f"Bookmarks validation error: {e}")
            return False
    
    def validate_services(self, services: List[Dict[str, Any]]) -> bool:
        """验证服务配置"""
        try:
            if not isinstance(services, list):
                return False
            
            for group in services:
                if not isinstance(group, dict):
                    return False
                
                # 每个组应该只有一个键
                if len(group) != 1:
                    return False
                
                group_name = list(group.keys())[0]
                group_items = group[group_name]
                
                if not isinstance(group_items, list):
                    return False
                
                # 验证每个服务项
                for item in group_items:
                    if not isinstance(item, dict):
                        return False
                    
                    # 每个服务项应该只有一个键
                    if len(item) != 1:
                        return False
                    
                    service_name = list(item.keys())[0]
                    service_data = item[service_name]
                    
                    if not isinstance(service_data, dict):
                        return False
                    
                    # 验证必需字段
                    if 'href' not in service_data:
                        return False
                    
                    # 验证 URL
                    if not self._validate_url(service_data['href']):
                        return False
                    
                    # 验证可选的 URL 字段
                    url_fields = ['siteMonitor', 'ping']
                    for field in url_fields:
                        if field in service_data and service_data[field]:
                            if not self._validate_url(service_data[field]):
                                return False
                    
                    # 验证状态样式
                    if 'statusStyle' in service_data:
                        if service_data['statusStyle'] not in self.valid_status_styles:
                            return False
                    
                    # 验证链接目标
                    if 'target' in service_data:
                        if service_data['target'] not in self.valid_targets:
                            return False
                    
                    # 验证布尔值
                    if 'showStats' in service_data:
                        if not isinstance(service_data['showStats'], bool):
                            return False
            
            return True
            
        except Exception as e:
            print(f"Services validation error: {e}")
            return False
    
    def validate_widgets(self, widgets: Dict[str, Any]) -> bool:
        """验证小工具配置"""
        try:
            if not isinstance(widgets, dict):
                return False
            
            # 支持的小工具类型
            supported_types = [
                'healthchecks', 'uptimekuma', 'ping', 'portainer',
                'plex', 'jellyfin', 'emby', 'sonarr', 'adguard', 
                'pihole', 'customapi', 'opnsense'
            ]
            
            for widget_name, widget_config in widgets.items():
                if not isinstance(widget_config, dict):
                    return False
                
                # 验证必需字段
                if 'type' not in widget_config:
                    return False
                
                widget_type = widget_config['type']
                if widget_type not in supported_types:
                    return False
                
                # 验证 URL（必需）
                if 'url' not in widget_config:
                    return False
                
                if not self._validate_url(widget_config['url']):
                    return False
                
                # 验证可选字段
                if 'refreshInterval' in widget_config:
                    interval = widget_config['refreshInterval']
                    if not isinstance(interval, int) or interval < 1000:
                        return False
                
                # 验证字段配置
                if 'fields' in widget_config:
                    fields = widget_config['fields']
                    if not isinstance(fields, list):
                        return False
                
                # 验证自定义映射（仅限 customapi）
                if 'mappings' in widget_config:
                    if widget_type != 'customapi':
                        return False
                    mappings = widget_config['mappings']
                    if not isinstance(mappings, list):
                        return False
                    
                    # 验证映射结构
                    for mapping in mappings:
                        if not isinstance(mapping, dict):
                            return False
                        if 'label' not in mapping or 'field' not in mapping:
                            return False
            
            return True
            
        except Exception as e:
            print(f"Widgets validation error: {e}")
            return False
    
    def validate_docker(self, docker_config: Dict[str, Any]) -> bool:
        """验证 Docker 配置"""
        try:
            if not isinstance(docker_config, dict):
                return False
            
            # 验证每个 Docker 实例配置
            for instance_name, config in docker_config.items():
                if not isinstance(config, dict):
                    return False
                
                # 验证连接配置 - 必须有 socket 或 host
                has_socket = 'socket' in config and config['socket']
                has_host = 'host' in config and config['host']
                
                if not (has_socket or has_host):
                    return False
                
                # 如果使用 host，验证格式
                if has_host:
                    host = config['host']
                    if not isinstance(host, str) or not host.strip():
                        return False
                    
                    # 验证端口（如果存在）
                    if 'port' in config:
                        port = config['port']
                        if not isinstance(port, int) or port < 1 or port > 65535:
                            return False
                
                # 验证 socket 路径
                if has_socket:
                    socket_path = config['socket']
                    if not isinstance(socket_path, str) or not socket_path.strip():
                        return False
                
                # 验证布尔值字段
                bool_fields = ['showStats', 'swarm']
                for field in bool_fields:
                    if field in config and not isinstance(config[field], bool):
                        return False
                
                # 验证字符串字段
                string_fields = ['username', 'password']
                for field in string_fields:
                    if field in config and not isinstance(config[field], str):
                        return False
                
                # 验证 TLS 配置
                if 'tls' in config:
                    tls_config = config['tls']
                    if not isinstance(tls_config, dict):
                        return False
                    
                    # 验证 TLS 相关字段
                    tls_bool_fields = ['skipVerify']
                    for field in tls_bool_fields:
                        if field in tls_config and not isinstance(tls_config[field], bool):
                            return False
                    
                    tls_string_fields = ['cert', 'key', 'ca']
                    for field in tls_string_fields:
                        if field in tls_config and not isinstance(tls_config[field], str):
                            return False
            
            return True
            
        except Exception as e:
            print(f"Docker validation error: {e}")
            return False
    
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