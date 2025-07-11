from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
import os
from utils.yaml_manager import YamlManager
from utils.config_validator import ConfigValidator
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'homeman-secret-key-change-in-production'

# 配置 Homepage 配置文件目录
HOMEPAGE_CONFIG_PATH = os.getenv('HOMEPAGE_CONFIG_PATH', '/app/config')

# 初始化 YAML 管理器
yaml_manager = YamlManager(HOMEPAGE_CONFIG_PATH)
validator = ConfigValidator()

def safe_calculate_stats(settings_data, bookmarks_data, services_data, widgets_data, docker_data):
    """安全地计算统计信息，避免空数据或格式错误导致的崩溃"""
    stats = {
        'bookmarks_count': 0,
        'bookmarks_groups': 0,
        'services_count': 0,
        'services_groups': 0,
        'widgets_count': 0,
        'docker_instances': 0,
        'configured_settings': 0
    }
    
    try:
        # 计算书签统计
        if isinstance(bookmarks_data, list):
            stats['bookmarks_groups'] = len(bookmarks_data)
            for group in bookmarks_data:
                if isinstance(group, dict) and group:
                    group_name = list(group.keys())[0]
                    if group_name in group and isinstance(group[group_name], list):
                        stats['bookmarks_count'] += len(group[group_name])
        
        # 计算服务统计
        if isinstance(services_data, list):
            stats['services_groups'] = len(services_data)
            for group in services_data:
                if isinstance(group, dict) and group:
                    group_name = list(group.keys())[0]
                    if group_name in group and isinstance(group[group_name], list):
                        stats['services_count'] += len(group[group_name])
        
        # 计算小工具统计
        if isinstance(widgets_data, dict):
            stats['widgets_count'] = len(widgets_data)
        
        # 计算 Docker 实例统计
        if isinstance(docker_data, dict):
            stats['docker_instances'] = len(docker_data)
        
        # 计算已配置的设置项
        if isinstance(settings_data, dict):
            stats['configured_settings'] = len([k for k, v in settings_data.items() 
                                              if v not in ['', None, False]])
    
    except Exception as e:
        logger.error(f"计算统计信息时发生错误: {e}")
        # 如果计算出错，返回默认的零值统计
    
    return stats

def handle_page_error(error_msg, template_name, **template_vars):
    """处理页面错误，显示错误信息并渲染模板"""
    logger.error(f"页面错误: {error_msg}")
    template_vars['error_message'] = f"加载配置时发生错误: {error_msg}"
    return render_template(template_name, **template_vars)

@app.route('/')
def index():
    """主页 - 显示配置概览"""
    try:
        # 获取配置状态
        config_status = yaml_manager.get_config_status()
        
        # 获取配置数据
        settings_data = yaml_manager.load_settings()
        bookmarks_data = yaml_manager.load_bookmarks()
        services_data = yaml_manager.load_services()
        widgets_data = yaml_manager.load_widgets()
        docker_data = yaml_manager.load_docker()
        
        # 安全地计算统计信息
        stats = safe_calculate_stats(settings_data, bookmarks_data, services_data, widgets_data, docker_data)
        
        # 获取最近备份
        recent_backups = yaml_manager.list_backups()[:3]  # 最近3个备份
        
        return render_template('index.html', 
                             config_status=config_status, 
                             stats=stats, 
                             recent_backups=recent_backups,
                             settings=settings_data)
    
    except Exception as e:
        # 如果发生任何错误，返回带错误信息的空页面
        return handle_page_error(str(e), 'index.html', 
                               config_status={}, 
                               stats={
                                   'bookmarks_count': 0,
                                   'bookmarks_groups': 0,
                                   'services_count': 0,
                                   'services_groups': 0,
                                   'widgets_count': 0,
                                   'docker_instances': 0,
                                   'configured_settings': 0
                               }, 
                               recent_backups=[],
                               settings={})

@app.route('/settings')
def settings():
    """全局设置页面"""
    try:
        settings_data = yaml_manager.load_settings()
        return render_template('settings.html', settings=settings_data)
    except Exception as e:
        return handle_page_error(str(e), 'settings.html', settings={})

@app.route('/settings', methods=['POST'])
def save_settings():
    """保存全局设置"""
    try:
        settings_data = request.form.to_dict()
        
        # 处理布尔值
        bool_fields = ['hideVersion', 'showStats', 'useEqualHeights', 'fiveColumns', 
                      'disableCollapse', 'groupsInitiallyCollapsed', 'fullWidth', 
                      'hideErrors', 'disableUpdateCheck']
        for field in bool_fields:
            if field in settings_data:
                settings_data[field] = settings_data[field].lower() == 'true'
        
        # 处理快速启动设置
        quicklaunch_fields = ['quicklaunchProvider', 'quicklaunchSearchDescriptions', 
                             'quicklaunchHideInternetSearch', 'quicklaunchShowSearchSuggestions', 
                             'quicklaunchHideVisitURL']
        quicklaunch_data = {}
        for field in quicklaunch_fields:
            if field in settings_data:
                key = field.replace('quicklaunch', '').lower()
                if key == 'provider':
                    quicklaunch_data[key] = settings_data[field]
                elif key in ['searchdescriptions', 'hideinternetssearch', 'showsearchsuggestions', 'hidevisiturl']:
                    # 处理布尔值
                    key_map = {
                        'searchdescriptions': 'searchDescriptions',
                        'hideinternetssearch': 'hideInternetSearch', 
                        'showsearchsuggestions': 'showSearchSuggestions',
                        'hidevisiturl': 'hideVisitURL'
                    }
                    quicklaunch_data[key_map[key]] = settings_data[field].lower() == 'true'
                del settings_data[field]
        
        if quicklaunch_data:
            settings_data['quicklaunch'] = quicklaunch_data
        
        # 处理数值类型
        numeric_fields = ['maxGroupColumns', 'maxBookmarkGroupColumns']
        for field in numeric_fields:
            if field in settings_data:
                try:
                    settings_data[field] = int(settings_data[field])
                except ValueError:
                    settings_data[field] = 4 if field == 'maxGroupColumns' else 6
        
        # 验证配置
        is_valid, validation_msg = validator.validate_settings(settings_data)
        if is_valid:
            success, save_msg = yaml_manager.save_settings(settings_data)
            if success:
                flash('设置保存成功！', 'success')
            else:
                flash(f'保存失败：{save_msg}', 'error')
        else:
            flash(f'设置验证失败：{validation_msg}', 'error')
            
    except Exception as e:
        flash(f'保存异常：{str(e)}', 'error')
    
    return redirect(url_for('settings'))

@app.route('/bookmarks')
def bookmarks():
    """书签管理页面"""
    try:
        bookmarks_data = yaml_manager.load_bookmarks()
        return render_template('bookmarks.html', bookmarks=bookmarks_data)
    except Exception as e:
        return handle_page_error(str(e), 'bookmarks.html', bookmarks=[])

@app.route('/bookmarks', methods=['POST'])
def save_bookmarks():
    """保存书签配置"""
    try:
        bookmarks_data = request.get_json()
        
        # 验证配置
        is_valid, validation_msg = validator.validate_bookmarks(bookmarks_data)
        if is_valid:
            success, save_msg = yaml_manager.save_bookmarks(bookmarks_data)
            if success:
                return jsonify({'status': 'success', 'message': '书签保存成功！'})
            else:
                return jsonify({'status': 'error', 'message': f'保存失败：{save_msg}'})
        else:
            return jsonify({'status': 'error', 'message': f'书签验证失败：{validation_msg}'})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'保存异常：{str(e)}'})

@app.route('/services')
def services():
    """服务管理页面"""
    try:
        services_data = yaml_manager.load_services()
        docker_data = yaml_manager.load_docker()
        return render_template('services.html', services=services_data, docker_config=docker_data)
    except Exception as e:
        return handle_page_error(str(e), 'services.html', services=[], docker_config={})

@app.route('/api/services', methods=['POST'])
def save_services():
    """保存服务配置"""
    try:
        request_data = request.get_json()
        action = request_data.get('action')
        
        current_services = yaml_manager.load_services()
        
        if action == 'add_service':
            # 添加新服务
            group_name = request_data.get('groupName')
            service_name = request_data.get('serviceName')
            service_data = request_data.get('serviceData')
            
            # 查找或创建分组
            group_found = False
            for group in current_services:
                if group_name in group:
                    group[group_name].append({service_name: service_data})
                    group_found = True
                    break
            
            if not group_found:
                current_services.append({group_name: [{service_name: service_data}]})
                
        elif action == 'update_service':
            # 更新服务
            group_name = request_data.get('groupName')
            service_name = request_data.get('serviceName')
            original_name = request_data.get('originalName')
            service_data = request_data.get('serviceData')
            
            for group in current_services:
                if group_name in group:
                    for i, service in enumerate(group[group_name]):
                        if original_name in service:
                            # 删除旧服务，添加新服务
                            del group[group_name][i]
                            group[group_name].append({service_name: service_data})
                            break
                    break
        
        # 验证并保存
        is_valid, validation_msg = validator.validate_services(current_services)
        if is_valid:
            success, save_msg = yaml_manager.save_services(current_services)
            if success:
                return jsonify({'success': True, 'message': '服务保存成功！'})
            else:
                return jsonify({'success': False, 'error': f'配置保存失败：{save_msg}'})
        else:
            return jsonify({'success': False, 'error': f'服务配置验证失败：{validation_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'保存失败：{str(e)}'})

@app.route('/api/services', methods=['DELETE'])
def delete_service():
    """删除服务"""
    try:
        request_data = request.get_json()
        group_name = request_data.get('groupName')
        service_name = request_data.get('serviceName')
        
        current_services = yaml_manager.load_services()
        
        for group in current_services:
            if group_name in group:
                group[group_name] = [service for service in group[group_name] 
                                   if service_name not in service]
                break
        
        success, save_msg = yaml_manager.save_services(current_services)
        if success:
            return jsonify({'success': True, 'message': '服务删除成功！'})
        else:
            return jsonify({'success': False, 'error': f'删除失败：{save_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'删除失败：{str(e)}'})

@app.route('/api/services/group', methods=['POST'])
def save_service_group():
    """保存服务分组"""
    try:
        request_data = request.get_json()
        action = request_data.get('action')
        group_name = request_data.get('groupName')
        
        current_services = yaml_manager.load_services()
        
        if action == 'add_group':
            # 添加新分组
            current_services.append({group_name: []})
        elif action == 'update_group':
            # 重命名分组
            original_name = request_data.get('originalName')
            for group in current_services:
                if original_name in group:
                    group_services = group[original_name]
                    del group[original_name]
                    group[group_name] = group_services
                    break
        
        success, save_msg = yaml_manager.save_services(current_services)
        if success:
            return jsonify({'success': True, 'message': '分组保存成功！'})
        else:
            return jsonify({'success': False, 'error': f'保存失败：{save_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'保存失败：{str(e)}'})

@app.route('/api/services/group', methods=['DELETE'])
def delete_service_group():
    """删除服务分组"""
    try:
        request_data = request.get_json()
        group_name = request_data.get('groupName')
        
        current_services = yaml_manager.load_services()
        current_services = [group for group in current_services if group_name not in group]
        
        success, save_msg = yaml_manager.save_services(current_services)
        if success:
            return jsonify({'success': True, 'message': '分组删除成功！'})
        else:
            return jsonify({'success': False, 'error': f'删除失败：{save_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'删除失败：{str(e)}'})

@app.route('/docker')
def docker():
    """Docker 管理页面"""
    try:
        docker_data = yaml_manager.load_docker()
        return render_template('docker.html', docker_config=docker_data)
    except Exception as e:
        return handle_page_error(str(e), 'docker.html', docker_config={})

@app.route('/api/docker', methods=['POST'])
def save_docker():
    """保存 Docker 配置"""
    try:
        docker_data = request.get_json()
        
        # 处理删除操作
        current_config = yaml_manager.load_docker()
        if '_delete' in docker_data:
            instance_to_delete = docker_data['_delete']
            if instance_to_delete in current_config:
                del current_config[instance_to_delete]
                docker_data = {k: v for k, v in docker_data.items() if k != '_delete'}
        
        # 合并新配置
        for instance_name, config in docker_data.items():
            if instance_name != '_delete':
                current_config[instance_name] = config
        
        # 验证配置
        is_valid, validation_msg = validator.validate_docker(current_config)
        if is_valid:
            success, save_msg = yaml_manager.save_docker(current_config)
            if success:
                return jsonify({'success': True, 'message': 'Docker 配置保存成功！'})
            else:
                return jsonify({'success': False, 'error': f'配置保存失败：{save_msg}'})
        else:
            return jsonify({'success': False, 'error': f'Docker 配置验证失败：{validation_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'保存失败：{str(e)}'})

@app.route('/api/docker/test/<instance_name>', methods=['POST'])
def test_docker_connection(instance_name):
    """测试 Docker 连接"""
    try:
        docker_config = yaml_manager.load_docker()
        
        if instance_name not in docker_config:
            return jsonify({'success': False, 'error': '找不到指定的 Docker 实例'})
        
        instance_config = docker_config[instance_name]
        
        # 这里简化测试逻辑，实际生产环境中应该使用 docker 客户端测试连接
        if 'socket' in instance_config:
            # 检查 socket 文件是否存在
            socket_path = instance_config['socket']
            if os.path.exists(socket_path):
                return jsonify({
                    'success': True, 
                    'info': f'Socket 文件存在: {socket_path}'
                })
            else:
                return jsonify({
                    'success': False, 
                    'error': f'Socket 文件不存在: {socket_path}'
                })
        elif 'host' in instance_config:
            # 简单的主机地址验证
            host = instance_config['host']
            port = instance_config.get('port', 2376)
            return jsonify({
                'success': True, 
                'info': f'配置有效: {host}:{port} (注意：实际连接测试需要 Docker 客户端)'
            })
        else:
            return jsonify({'success': False, 'error': '无效的连接配置'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'测试失败：{str(e)}'})

@app.route('/widgets')
def widgets():
    """小工具管理页面"""
    try:
        widgets_data = yaml_manager.load_widgets()
        return render_template('widgets.html', widgets=widgets_data)
    except Exception as e:
        return handle_page_error(str(e), 'widgets.html', widgets={})

@app.route('/api/widgets', methods=['POST'])
def save_widgets():
    """保存小工具配置"""
    try:
        request_data = request.get_json()
        action = request_data.get('action')
        
        current_widgets = yaml_manager.load_widgets()
        
        if action == 'add_widget':
            # 添加新小工具
            widget_name = request_data.get('widgetName')
            widget_data = request_data.get('widgetData')
            current_widgets[widget_name] = widget_data
                
        elif action == 'update_widget':
            # 更新小工具
            widget_name = request_data.get('widgetName')
            original_name = request_data.get('originalName')
            widget_data = request_data.get('widgetData')
            
            # 删除旧名称的小工具
            if original_name and original_name != widget_name:
                if original_name in current_widgets:
                    del current_widgets[original_name]
            
            current_widgets[widget_name] = widget_data
        
        # 验证并保存
        is_valid, validation_msg = validator.validate_widgets(current_widgets)
        if is_valid:
            success, save_msg = yaml_manager.save_widgets(current_widgets)
            if success:
                return jsonify({'success': True, 'message': '小工具保存成功！'})
            else:
                return jsonify({'success': False, 'error': f'配置保存失败：{save_msg}'})
        else:
            return jsonify({'success': False, 'error': f'小工具配置验证失败：{validation_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'保存失败：{str(e)}'})

@app.route('/api/widgets', methods=['DELETE'])
def delete_widget():
    """删除小工具"""
    try:
        request_data = request.get_json()
        widget_name = request_data.get('widgetName')
        
        current_widgets = yaml_manager.load_widgets()
        
        if widget_name in current_widgets:
            del current_widgets[widget_name]
        
        success, save_msg = yaml_manager.save_widgets(current_widgets)
        if success:
            return jsonify({'success': True, 'message': '小工具删除成功！'})
        else:
            return jsonify({'success': False, 'error': f'删除失败：{save_msg}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'删除失败：{str(e)}'})

@app.route('/api/widgets/test/<widget_name>', methods=['POST'])
def test_widget(widget_name):
    """测试小工具连接"""
    try:
        widgets_config = yaml_manager.load_widgets()
        
        if widget_name not in widgets_config:
            return jsonify({'success': False, 'error': '找不到指定的小工具'})
        
        widget_config = widgets_config[widget_name]
        widget_url = widget_config.get('url')
        
        if not widget_url:
            return jsonify({'success': False, 'error': '小工具缺少 URL 配置'})
        
        # 这里简化测试逻辑，实际生产环境中应该根据小工具类型进行相应的测试
        import requests
        from urllib.parse import urlparse
        
        # 验证URL格式
        parsed_url = urlparse(widget_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            return jsonify({'success': False, 'error': 'URL 格式无效'})
        
        # 简单的连接测试
        try:
            response = requests.get(widget_url, timeout=10)
            return jsonify({
                'success': True, 
                'data': {
                    'status_code': response.status_code,
                    'response_time': f'{response.elapsed.total_seconds():.2f}s',
                    'content_type': response.headers.get('content-type', 'unknown')
                }
            })
        except requests.exceptions.RequestException as e:
            return jsonify({'success': False, 'error': f'连接测试失败: {str(e)}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'测试失败：{str(e)}'})

@app.route('/config')
def config():
    """配置文件管理页面"""
    try:
        config_status = yaml_manager.get_config_status()
        return render_template('config.html', status=config_status)
    except Exception as e:
        return handle_page_error(str(e), 'config.html', status={})

@app.route('/api/backup', methods=['GET', 'POST'])
def backup_config():
    """备份配置文件或获取备份信息"""
    if request.method == 'POST':
        try:
            backup_path, backup_msg = yaml_manager.backup_configs()
            if backup_path:
                return jsonify({'success': True, 'backup_path': backup_path, 'message': backup_msg})
            else:
                return jsonify({'success': False, 'error': backup_msg})
        except Exception as e:
            return jsonify({'success': False, 'error': f'备份异常：{str(e)}'})
    else:
        # GET 请求返回备份列表（保持兼容性）
        try:
            backup_path, backup_msg = yaml_manager.backup_configs()
            if backup_path:
                return jsonify({'status': 'success', 'backup_path': backup_path, 'message': backup_msg})
            else:
                return jsonify({'status': 'error', 'message': backup_msg})
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'备份异常：{str(e)}'})

@app.route('/api/backup', methods=['DELETE'])
def delete_backup():
    """删除备份"""
    try:
        request_data = request.get_json()
        backup_name = request_data.get('backup_name')
        
        if yaml_manager.delete_backup(backup_name):
            return jsonify({'success': True, 'message': '备份删除成功'})
        else:
            return jsonify({'success': False, 'error': '删除失败'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/backups')
def list_backups():
    """获取备份列表"""
    try:
        backups = yaml_manager.list_backups()
        return jsonify({'success': True, 'backups': backups})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/restore', methods=['POST'])
def restore_backup():
    """恢复备份"""
    try:
        request_data = request.get_json()
        backup_name = request_data.get('backup_name')
        
        backup_path = yaml_manager.get_backup_path(backup_name)
        success, restore_msg = yaml_manager.restore_configs(backup_path)
        if success:
            return jsonify({'success': True, 'message': f'配置恢复成功：{restore_msg}'})
        else:
            return jsonify({'success': False, 'error': f'恢复失败：{restore_msg}'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'恢复异常：{str(e)}'})

@app.route('/api/download/configs')
def download_all_configs():
    """下载所有配置文件压缩包"""
    try:
        zip_path = yaml_manager.create_config_zip()
        return send_file(zip_path, as_attachment=True, download_name='homeman-configs.zip')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/config/<config_name>')
def download_single_config(config_name):
    """下载单个配置文件"""
    try:
        file_path = yaml_manager.get_config_file_path(config_name)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True, download_name=f'{config_name}.yaml')
        else:
            return jsonify({'error': '配置文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/backup/<backup_name>')
def download_backup(backup_name):
    """下载备份文件"""
    try:
        backup_path = yaml_manager.get_backup_path(backup_name)
        if os.path.exists(backup_path):
            zip_path = yaml_manager.create_backup_zip(backup_name)
            return send_file(zip_path, as_attachment=True, download_name=f'{backup_name}.zip')
        else:
            return jsonify({'error': '备份不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/yaml-editor')
def yaml_editor():
    """YAML 编辑器页面"""
    try:
        config_types = yaml_manager.get_supported_config_types()
        config_status = yaml_manager.get_config_status()
        return render_template('yaml_editor.html', 
                             config_types=config_types, 
                             config_status=config_status)
    except Exception as e:
        return handle_page_error(str(e), 'yaml_editor.html', 
                               config_types=[], 
                               config_status={})

@app.route('/api/yaml/load/<config_name>')
def load_yaml_content(config_name):
    """加载原始 YAML 文件内容"""
    try:
        if config_name not in yaml_manager.get_supported_config_types():
            return jsonify({'success': False, 'error': f'不支持的配置类型: {config_name}'}), 400
        
        content, error_msg = yaml_manager.load_raw_yaml_file(config_name)
        if error_msg:
            return jsonify({'success': False, 'error': error_msg}), 500
        
        return jsonify({
            'success': True, 
            'content': content,
            'config_name': config_name
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'加载失败: {str(e)}'}), 500

@app.route('/api/yaml/save/<config_name>', methods=['POST'])
def save_yaml_content(config_name):
    """保存原始 YAML 文件内容"""
    try:
        if config_name not in yaml_manager.get_supported_config_types():
            return jsonify({'success': False, 'error': f'不支持的配置类型: {config_name}'}), 400
        
        request_data = request.get_json()
        content = request_data.get('content', '')
        
        # 允许保存空文件，空文件在某些情况下是有意义的（如清空配置）
        
        # 保存文件
        success, save_msg = yaml_manager.save_raw_yaml_file(config_name, content)
        if success:
            return jsonify({'success': True, 'message': save_msg})
        else:
            return jsonify({'success': False, 'error': save_msg}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'保存失败: {str(e)}'}), 500

@app.route('/api/yaml/validate', methods=['POST'])
def validate_yaml_content():
    """验证 YAML 语法"""
    try:
        request_data = request.get_json()
        content = request_data.get('content', '')
        
        is_valid, error_msg = yaml_manager.validate_yaml_syntax(content)
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'error': error_msg if not is_valid else None
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'验证失败: {str(e)}'}), 500

@app.route('/api/yaml/preview/<config_name>', methods=['POST'])
def preview_yaml_config(config_name):
    """预览 YAML 配置解析结果"""
    try:
        if config_name not in yaml_manager.get_supported_config_types():
            return jsonify({'success': False, 'error': f'不支持的配置类型: {config_name}'}), 400
        
        request_data = request.get_json()
        content = request_data.get('content', '')
        
        # 验证语法
        is_valid, error_msg = yaml_manager.validate_yaml_syntax(content)
        if not is_valid:
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # 解析配置
        import yaml
        parsed_data = yaml.safe_load(content)
        
        return jsonify({
            'success': True,
            'parsed_data': parsed_data,
            'type': type(parsed_data).__name__
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'预览失败: {str(e)}'}), 500

if __name__ == '__main__':
    # 确保配置目录存在
    os.makedirs(HOMEPAGE_CONFIG_PATH, exist_ok=True)
    
    app.run(host='0.0.0.0', port=3100, debug=True) 