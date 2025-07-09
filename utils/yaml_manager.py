import yaml
import os
import shutil
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        try:
            os.makedirs(config_path, exist_ok=True)
            os.makedirs(self.backup_dir, exist_ok=True)
            logger.info(f"Initialized YamlManager with config path: {config_path}")
        except Exception as e:
            logger.error(f"Failed to create directories: {e}")
            raise
    
    def _load_yaml_file(self, file_path: str) -> Dict[str, Any]:
        """加载 YAML 文件"""
        try:
            if os.path.exists(file_path):
                logger.info(f"Loading YAML file: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = yaml.safe_load(f)
                    result = data if data is not None else {}
                    logger.info(f"Successfully loaded {file_path}, data size: {len(result) if isinstance(result, (dict, list)) else 'N/A'}")
                    return result
            else:
                logger.warning(f"YAML file does not exist: {file_path}")
                return {}
        except yaml.YAMLError as e:
            logger.error(f"YAML parsing error in {file_path}: {e}")
            return {}
        except UnicodeDecodeError as e:
            logger.error(f"Encoding error in {file_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error loading {file_path}: {e}")
            return {}
    
    def _save_yaml_file(self, file_path: str, data: Dict[str, Any]) -> Tuple[bool, str]:
        """保存 YAML 文件，返回(成功状态, 错误信息)"""
        try:
            logger.info(f"Saving YAML file: {file_path}")
            
            # 创建备份
            if os.path.exists(file_path):
                backup_path = f"{file_path}.backup"
                shutil.copy2(file_path, backup_path)
                logger.info(f"Created backup: {backup_path}")
            
            # 保存文件
            with open(file_path, 'w', encoding='utf-8') as f:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, 
                         indent=2, sort_keys=False)
            
            # 验证保存结果
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                logger.info(f"Successfully saved {file_path}, file size: {file_size} bytes")
                return True, "保存成功"
            else:
                error_msg = f"文件保存后不存在: {file_path}"
                logger.error(error_msg)
                return False, error_msg
                
        except yaml.YAMLError as e:
            error_msg = f"YAML 序列化错误: {e}"
            logger.error(f"YAML error saving {file_path}: {e}")
            return False, error_msg
        except IOError as e:
            error_msg = f"文件写入错误: {e}"
            logger.error(f"IO error saving {file_path}: {e}")
            return False, error_msg
        except Exception as e:
            error_msg = f"未知错误: {e}"
            logger.error(f"Unexpected error saving {file_path}: {e}")
            return False, error_msg
    
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
    
    def save_settings(self, settings: Dict[str, Any]) -> Tuple[bool, str]:
        """保存全局设置，返回(成功状态, 错误信息)"""
        logger.info(f"Saving settings with {len(settings)} keys")
        # 清理空值
        clean_settings = {k: v for k, v in settings.items() if v != '' and v is not None}
        logger.info(f"Cleaned settings, {len(clean_settings)} keys remaining")
        return self._save_yaml_file(self.settings_file, clean_settings)
    
    def load_bookmarks(self) -> list:
        """加载书签配置"""
        bookmarks = self._load_yaml_file(self.bookmarks_file)
        if isinstance(bookmarks, list):
            return bookmarks
        return []
    
    def save_bookmarks(self, bookmarks: list) -> Tuple[bool, str]:
        """保存书签配置，返回(成功状态, 错误信息)"""
        logger.info(f"Saving bookmarks with {len(bookmarks)} groups")
        return self._save_yaml_file(self.bookmarks_file, bookmarks)
    
    def load_services(self) -> list:
        """加载服务配置"""
        services = self._load_yaml_file(self.services_file)
        if isinstance(services, list):
            return services
        return []
    
    def save_services(self, services: list) -> Tuple[bool, str]:
        """保存服务配置，返回(成功状态, 错误信息)"""
        logger.info(f"Saving services with {len(services)} groups")
        return self._save_yaml_file(self.services_file, services)
    
    def load_widgets(self) -> Dict[str, Any]:
        """加载小工具配置"""
        return self._load_yaml_file(self.widgets_file)
    
    def save_widgets(self, widgets: Dict[str, Any]) -> Tuple[bool, str]:
        """保存小工具配置，返回(成功状态, 错误信息)"""
        logger.info(f"Saving widgets with {len(widgets)} items")
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
    
    def save_docker(self, docker_config: Dict[str, Any]) -> Tuple[bool, str]:
        """保存 Docker 配置，返回(成功状态, 错误信息)"""
        logger.info(f"Saving docker config with {len(docker_config)} instances")
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
    
    def backup_configs(self) -> Tuple[str, str]:
        """备份所有配置文件，返回(备份路径, 错误信息)"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = os.path.join(self.backup_dir, f'backup_{timestamp}')
            logger.info(f"Creating backup at: {backup_path}")
            
            os.makedirs(backup_path, exist_ok=True)
            
            files_to_backup = [
                self.settings_file,
                self.bookmarks_file,
                self.services_file,
                self.widgets_file,
                self.docker_file
            ]
            
            backed_up_files = 0
            for file_path in files_to_backup:
                if os.path.exists(file_path):
                    filename = os.path.basename(file_path)
                    destination = os.path.join(backup_path, filename)
                    shutil.copy2(file_path, destination)
                    backed_up_files += 1
                    logger.info(f"Backed up: {filename}")
                else:
                    logger.warning(f"File not found for backup: {file_path}")
            
            logger.info(f"Backup completed: {backed_up_files} files backed up")
            return backup_path, f"成功备份 {backed_up_files} 个文件"
            
        except Exception as e:
            error_msg = f"备份失败: {e}"
            logger.error(f"Backup failed: {e}")
            return "", error_msg
    
    def restore_configs(self, backup_path: str) -> Tuple[bool, str]:
        """从备份恢复配置文件，返回(成功状态, 错误信息)"""
        try:
            logger.info(f"Restoring configs from: {backup_path}")
            
            if not os.path.exists(backup_path):
                error_msg = f"备份路径不存在: {backup_path}"
                logger.error(error_msg)
                return False, error_msg
            
            files_to_restore = [
                'settings.yaml',
                'bookmarks.yaml',
                'services.yaml',
                'widgets.yaml',
                'docker.yaml'
            ]
            
            restored_files = 0
            for filename in files_to_restore:
                backup_file = os.path.join(backup_path, filename)
                if os.path.exists(backup_file):
                    target_file = os.path.join(self.config_path, filename)
                    shutil.copy2(backup_file, target_file)
                    restored_files += 1
                    logger.info(f"Restored: {filename}")
                else:
                    logger.warning(f"Backup file not found: {backup_file}")
            
            if restored_files > 0:
                logger.info(f"Restore completed: {restored_files} files restored")
                return True, f"成功恢复 {restored_files} 个文件"
            else:
                error_msg = "没有找到可恢复的配置文件"
                logger.warning(error_msg)
                return False, error_msg
                
        except Exception as e:
            error_msg = f"恢复失败: {e}"
            logger.error(f"Error restoring configs: {e}")
            return False, error_msg

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

    def restore_backup(self, backup_name: str) -> Tuple[bool, str]:
        """按名称恢复备份，返回(成功状态, 错误信息)"""
        try:
            backup_path = os.path.join(self.backup_dir, backup_name)
            return self.restore_configs(backup_path)
        except Exception as e:
            error_msg = f"恢复备份异常: {e}"
            logger.error(error_msg)
            return False, error_msg

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

    def load_raw_yaml_file(self, config_name: str) -> Tuple[str, str]:
        """加载原始 YAML 文件内容，返回(文件内容, 错误信息)"""
        try:
            file_path = self.get_config_file_path(config_name)
            if not file_path:
                return "", f"未知的配置类型: {config_name}"
            
            if os.path.exists(file_path):
                logger.info(f"Loading raw YAML file: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    logger.info(f"Successfully loaded raw content from {file_path}, length: {len(content)}")
                    return content, ""
            else:
                logger.warning(f"Raw YAML file does not exist: {file_path}")
                # 为不存在的文件返回默认内容
                default_content = self._get_default_yaml_content(config_name)
                return default_content, ""
                
        except UnicodeDecodeError as e:
            error_msg = f"文件编码错误: {e}"
            logger.error(f"Encoding error reading {file_path}: {e}")
            return "", error_msg
        except Exception as e:
            error_msg = f"读取文件失败: {e}"
            logger.error(f"Unexpected error reading {file_path}: {e}")
            return "", error_msg

    def save_raw_yaml_file(self, config_name: str, content: str) -> Tuple[bool, str]:
        """保存原始 YAML 文件内容，返回(成功状态, 错误信息)"""
        try:
            file_path = self.get_config_file_path(config_name)
            if not file_path:
                return False, f"未知的配置类型: {config_name}"
            
            logger.info(f"Saving raw YAML file: {file_path}")
            
            # 验证 YAML 语法
            try:
                yaml.safe_load(content)
            except yaml.YAMLError as e:
                error_msg = f"YAML 语法错误: {e}"
                logger.error(f"YAML syntax error: {e}")
                return False, error_msg
            
            # 创建备份
            if os.path.exists(file_path):
                backup_path = f"{file_path}.backup"
                shutil.copy2(file_path, backup_path)
                logger.info(f"Created backup: {backup_path}")
            
            # 保存文件
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 验证保存结果
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                logger.info(f"Successfully saved raw content to {file_path}, file size: {file_size} bytes")
                return True, "保存成功"
            else:
                error_msg = f"文件保存后不存在: {file_path}"
                logger.error(error_msg)
                return False, error_msg
                
        except IOError as e:
            error_msg = f"文件写入错误: {e}"
            logger.error(f"IO error saving {file_path}: {e}")
            return False, error_msg
        except Exception as e:
            error_msg = f"保存失败: {e}"
            logger.error(f"Unexpected error saving {file_path}: {e}")
            return False, error_msg

    def _get_default_yaml_content(self, config_name: str) -> str:
        """获取默认的 YAML 文件内容"""
        defaults = {
            'settings': """# Homepage 全局设置
title: "Homepage"
startUrl: "/"
theme: "light"
color: "slate"
headerStyle: "underlined"
language: "zh-cn"
hideVersion: false
showStats: false
target: "_self"
""",
            'bookmarks': """# Homepage 书签配置
# 示例：
# - 开发工具:
#     - Github:
#         - href: https://github.com
#           icon: github
""",
            'services': """# Homepage 服务配置
# 示例：
# - 系统监控:
#     - 服务器状态:
#         href: http://localhost:3000
#         description: 服务器监控面板
#         icon: server
""",
            'widgets': """# Homepage 小工具配置
# 示例：
# - resources:
#     label: 系统资源
#     cpu: true
#     memory: true
""",
            'docker': """# Homepage Docker 配置
# 示例：
# my-docker:
#   socket: /var/run/docker.sock
#   showStats: true
"""
        }
        return defaults.get(config_name, "# 新的配置文件\n")

    def get_supported_config_types(self) -> list:
        """获取支持的配置文件类型"""
        return ['settings', 'bookmarks', 'services', 'widgets', 'docker']

    def validate_yaml_syntax(self, content: str) -> Tuple[bool, str]:
        """验证 YAML 语法，返回(是否有效, 错误信息)"""
        try:
            yaml.safe_load(content)
            return True, ""
        except yaml.YAMLError as e:
            return False, f"YAML 语法错误: {e}"
        except Exception as e:
            return False, f"验证失败: {e}" 