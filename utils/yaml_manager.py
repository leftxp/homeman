import yaml
import os
import shutil
from datetime import datetime
from typing import Dict, Any, Optional

class YamlManager:
    """Homepage YAML 配置文件管理器"""
    
    def __init__(self, config_path: str = '/app/config'):
        self.config_path = config_path
        self.settings_file = os.path.join(config_path, 'settings.yaml')
        self.bookmarks_file = os.path.join(config_path, 'bookmarks.yaml')
        self.services_file = os.path.join(config_path, 'services.yaml')
        self.widgets_file = os.path.join(config_path, 'widgets.yaml')
        self.docker_file = os.path.join(config_path, 'docker.yaml')
        self.backup_dir = os.path.join(config_path, 'backups')
        
        # 确保目录存在
        os.makedirs(config_path, exist_ok=True)
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def _load_yaml_file(self, file_path: str) -> Dict[str, Any]:
        """加载 YAML 文件"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    return data if data is not None else {}
            return {}
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return {}
    
    def _save_yaml_file(self, file_path: str, data: Dict[str, Any]) -> bool:
        """保存 YAML 文件"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, 
                         indent=2, sort_keys=False)
            return True
        except Exception as e:
            print(f"Error saving {file_path}: {e}")
            return False
    
    def load_settings(self) -> Dict[str, Any]:
        """加载全局设置"""
        default_settings = {
            'title': 'Homepage',
            'startUrl': '/',
            'theme': 'light',
            'color': 'slate',
            'headerStyle': 'underlined',
            'language': 'en',
            'hideVersion': False,
            'showStats': False,
            'statusStyle': '',
            'useEqualHeights': False,
            'fiveColumns': False,
            'disableCollapse': False,
            'groupsInitiallyCollapsed': False,
            'iconStyle': 'gradient',
            'target': '_self',
            'layout': {},
            'providers': {}
        }
        
        settings = self._load_yaml_file(self.settings_file)
        # 合并默认设置
        for key, value in default_settings.items():
            if key not in settings:
                settings[key] = value
        
        return settings
    
    def save_settings(self, settings: Dict[str, Any]) -> bool:
        """保存全局设置"""
        # 清理空值
        clean_settings = {k: v for k, v in settings.items() if v != '' and v is not None}
        return self._save_yaml_file(self.settings_file, clean_settings)
    
    def load_bookmarks(self) -> list:
        """加载书签配置"""
        bookmarks = self._load_yaml_file(self.bookmarks_file)
        if isinstance(bookmarks, list):
            return bookmarks
        return []
    
    def save_bookmarks(self, bookmarks: list) -> bool:
        """保存书签配置"""
        return self._save_yaml_file(self.bookmarks_file, bookmarks)
    
    def load_services(self) -> list:
        """加载服务配置"""
        services = self._load_yaml_file(self.services_file)
        if isinstance(services, list):
            return services
        return []
    
    def save_services(self, services: list) -> bool:
        """保存服务配置"""
        return self._save_yaml_file(self.services_file, services)
    
    def load_widgets(self) -> Dict[str, Any]:
        """加载小工具配置"""
        return self._load_yaml_file(self.widgets_file)
    
    def save_widgets(self, widgets: Dict[str, Any]) -> bool:
        """保存小工具配置"""
        return self._save_yaml_file(self.widgets_file, widgets)
    
    def load_docker(self) -> Dict[str, Any]:
        """加载 Docker 配置"""
        default_docker = {
            'my-docker': {
                'socket': '/var/run/docker.sock',
                'showStats': True
            }
        }
        
        docker_config = self._load_yaml_file(self.docker_file)
        # 如果配置为空，返回默认配置
        if not docker_config:
            return default_docker
        
        return docker_config
    
    def save_docker(self, docker_config: Dict[str, Any]) -> bool:
        """保存 Docker 配置"""
        return self._save_yaml_file(self.docker_file, docker_config)
    
    def get_config_status(self) -> Dict[str, Any]:
        """获取配置文件状态"""
        status = {}
        files = {
            'settings': self.settings_file,
            'bookmarks': self.bookmarks_file,
            'services': self.services_file,
            'widgets': self.widgets_file,
            'docker': self.docker_file
        }
        
        for name, file_path in files.items():
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                status[name] = {
                    'exists': True,
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                }
            else:
                status[name] = {
                    'exists': False,
                    'size': 0,
                    'modified': None
                }
        
        return status
    
    def backup_configs(self) -> str:
        """备份所有配置文件"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = os.path.join(self.backup_dir, f'backup_{timestamp}')
        os.makedirs(backup_path, exist_ok=True)
        
        files_to_backup = [
            self.settings_file,
            self.bookmarks_file,
            self.services_file,
            self.widgets_file,
            self.docker_file
        ]
        
        for file_path in files_to_backup:
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                shutil.copy2(file_path, os.path.join(backup_path, filename))
        
        return backup_path
    
    def restore_configs(self, backup_path: str) -> bool:
        """从备份恢复配置文件"""
        try:
            if not os.path.exists(backup_path):
                return False
            
            files_to_restore = [
                'settings.yaml',
                'bookmarks.yaml',
                'services.yaml',
                'widgets.yaml',
                'docker.yaml'
            ]
            
            for filename in files_to_restore:
                backup_file = os.path.join(backup_path, filename)
                if os.path.exists(backup_file):
                    target_file = os.path.join(self.config_path, filename)
                    shutil.copy2(backup_file, target_file)
            
            return True
        except Exception as e:
            print(f"Error restoring configs: {e}")
            return False

    def list_backups(self) -> list:
        """获取备份列表"""
        try:
            backups = []
            if os.path.exists(self.backup_dir):
                for backup_name in os.listdir(self.backup_dir):
                    backup_path = os.path.join(self.backup_dir, backup_name)
                    if os.path.isdir(backup_path):
                        stat = os.stat(backup_path)
                        backups.append({
                            'name': backup_name,
                            'date': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                            'timestamp': stat.st_mtime
                        })
            
            # 按时间戳倒序排列
            backups.sort(key=lambda x: x['timestamp'], reverse=True)
            return backups
        except Exception as e:
            print(f"Error listing backups: {e}")
            return []

    def delete_backup(self, backup_name: str) -> bool:
        """删除备份"""
        try:
            backup_path = os.path.join(self.backup_dir, backup_name)
            if os.path.exists(backup_path) and os.path.isdir(backup_path):
                shutil.rmtree(backup_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting backup: {e}")
            return False

    def restore_backup(self, backup_name: str) -> bool:
        """按名称恢复备份"""
        try:
            backup_path = os.path.join(self.backup_dir, backup_name)
            return self.restore_configs(backup_path)
        except Exception as e:
            print(f"Error restoring backup: {e}")
            return False

    def get_backup_path(self, backup_name: str) -> str:
        """获取备份路径"""
        return os.path.join(self.backup_dir, backup_name)

    def get_config_file_path(self, config_name: str) -> str:
        """获取配置文件路径"""
        file_map = {
            'settings': self.settings_file,
            'bookmarks': self.bookmarks_file,
            'services': self.services_file,
            'widgets': self.widgets_file,
            'docker': self.docker_file
        }
        return file_map.get(config_name, '')

    def create_config_zip(self) -> str:
        """创建配置文件压缩包"""
        try:
            import zipfile
            import tempfile
            
            # 创建临时文件
            temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            temp_zip.close()
            
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                config_files = [
                    ('settings.yaml', self.settings_file),
                    ('bookmarks.yaml', self.bookmarks_file),
                    ('services.yaml', self.services_file),
                    ('widgets.yaml', self.widgets_file),
                    ('docker.yaml', self.docker_file)
                ]
                
                for filename, filepath in config_files:
                    if os.path.exists(filepath):
                        zipf.write(filepath, filename)
            
            return temp_zip.name
        except Exception as e:
            print(f"Error creating config zip: {e}")
            return None

    def create_backup_zip(self, backup_name: str) -> str:
        """创建备份压缩包"""
        try:
            import zipfile
            import tempfile
            
            backup_path = os.path.join(self.backup_dir, backup_name)
            if not os.path.exists(backup_path):
                return None
            
            # 创建临时文件
            temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            temp_zip.close()
            
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(backup_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arc_name = os.path.relpath(file_path, backup_path)
                        zipf.write(file_path, arc_name)
            
            return temp_zip.name
        except Exception as e:
            print(f"Error creating backup zip: {e}")
            return None 