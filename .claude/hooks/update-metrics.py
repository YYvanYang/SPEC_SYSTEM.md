#!/usr/bin/env python3
"""
Update delivery and quality metrics after task completion
"""
import sys
import json
import os
from datetime import datetime
from pathlib import Path

def main():
    try:
        # Read task completion data from stdin
        task_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
        
        timestamp = datetime.now().isoformat()
        metrics_dir = Path("analytics")
        metrics_dir.mkdir(exist_ok=True)
        
        # Update delivery metrics
        delivery_metrics_file = metrics_dir / "delivery-metrics.json"
        delivery_data = load_json_file(delivery_metrics_file)
        
        # Track task completion
        if 'task_id' in task_data:
            task_completion = {
                "task_id": task_data['task_id'],
                "completed_at": timestamp,
                "agent": task_data.get('agent', 'unknown'),
                "duration": task_data.get('duration_minutes', 0),
                "quality_score": task_data.get('quality_score', 0)
            }
            
            if 'completions' not in delivery_data:
                delivery_data['completions'] = []
            delivery_data['completions'].append(task_completion)
            
            # Update summary metrics
            delivery_data['total_tasks_completed'] = len(delivery_data['completions'])
            delivery_data['last_updated'] = timestamp
            
            save_json_file(delivery_metrics_file, delivery_data)
            print(f"📊 Updated delivery metrics: Task {task_data['task_id']} completed")
        
        # Update quality metrics
        quality_metrics_file = metrics_dir / "quality-metrics.json"
        quality_data = load_json_file(quality_metrics_file)
        
        if 'quality_score' in task_data:
            quality_entry = {
                "timestamp": timestamp,
                "score": task_data['quality_score'],
                "agent": task_data.get('agent', 'unknown'),
                "feature": task_data.get('feature', 'unknown')
            }
            
            if 'quality_scores' not in quality_data:
                quality_data['quality_scores'] = []
            quality_data['quality_scores'].append(quality_entry)
            
            # Calculate rolling average
            recent_scores = quality_data['quality_scores'][-10:]  # Last 10 scores
            avg_score = sum(entry['score'] for entry in recent_scores) / len(recent_scores)
            quality_data['rolling_average'] = round(avg_score, 2)
            quality_data['last_updated'] = timestamp
            
            save_json_file(quality_metrics_file, quality_data)
            print(f"📈 Updated quality metrics: Average score {quality_data['rolling_average']}")
        
        # Update team performance metrics
        team_metrics_file = metrics_dir / "team-metrics.json"
        team_data = load_json_file(team_metrics_file)
        
        agent = task_data.get('agent', 'unknown')
        if agent != 'unknown':
            if 'agent_performance' not in team_data:
                team_data['agent_performance'] = {}
            
            if agent not in team_data['agent_performance']:
                team_data['agent_performance'][agent] = {
                    'tasks_completed': 0,
                    'total_duration': 0,
                    'quality_scores': []
                }
            
            agent_data = team_data['agent_performance'][agent]
            agent_data['tasks_completed'] += 1
            agent_data['total_duration'] += task_data.get('duration_minutes', 0)
            
            if 'quality_score' in task_data:
                agent_data['quality_scores'].append(task_data['quality_score'])
                agent_data['avg_quality'] = sum(agent_data['quality_scores']) / len(agent_data['quality_scores'])
            
            team_data['last_updated'] = timestamp
            save_json_file(team_metrics_file, team_data)
            print(f"👥 Updated team metrics for agent: {agent}")
        
        print("✅ Metrics update completed successfully")
        
    except Exception as e:
        print(f"❌ Error updating metrics: {e}")
        sys.exit(1)

def load_json_file(file_path):
    """Load JSON data from file, return empty dict if file doesn't exist"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_json_file(file_path, data):
    """Save data to JSON file with pretty formatting"""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2, sort_keys=True)

if __name__ == "__main__":
    main()