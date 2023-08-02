import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Task {
  _id: string;
  title: string;
  category: string;
  isDone: boolean;
  date?: string;
}

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css'],
})
export class TaskComponent implements OnInit {
  newTask: string = ''; 
  newTaskDate: string = ''; 
  tasks: Task[] = []; 
  filteredTasks: Task[] = []; 
  currentCategory: string = 'all'; 
  editTaskId: string | null = null; 

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchTasks(); 
  }

  // Fetch all tasks from the server
  fetchTasks() {
    const url = 'http://localhost:3000/api/tasks';
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      console.error('Access token not available');
      return;
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` });

    this.http.get<Task[]>(url, { headers }).subscribe(
      (tasks: Task[]) => {
        this.tasks = tasks;
        this.filterTasks(this.currentCategory); 
      },
      (error: any) => {
        console.error('Error fetching tasks:', error);
      }
    );
  }

  // Method to filter tasks based on category
  filterTasks(category: string) {
    if (category === 'all') {
      this.filteredTasks = this.tasks;
    } else {
      this.filteredTasks = this.tasks.filter((task) => task.category === category);
    }
    this.currentCategory = category; 
  }

 
  addTask() {
    // Check if the newTask is empty
    if (!this.newTask.trim()) {
      console.error('Task cannot be empty');
      return;
    }

    const newTask: Task = {
      _id: '', 
      title: this.newTask,
      category: this.currentCategory, 
      isDone: false, 
      date: this.newTaskDate.trim() ? this.newTaskDate : undefined, 
    };

    const url = 'http://localhost:3000/api/tasks';
    const accessToken = localStorage.getItem('accessToken'); 

    if (!accessToken) {
      console.error('Access token not available');
      return;
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` });

    this.http.post<Task>(url, newTask, { headers }).subscribe(
      (task: Task) => {
        this.tasks.push(task);
        this.filterTasks(this.currentCategory); 
        this.newTask = ''; 
        this.newTaskDate = ''; 
      },
      (error: any) => {
        console.error('Error adding task:', error);
      }
    );
  }

  // Method to delete a task
  deleteTask(taskId: string) {
    const url = `http://localhost:3000/api/tasks/${taskId}`;
    const accessToken = localStorage.getItem('accessToken'); 

    if (!accessToken) {
      console.error('Access token not available');
      return;
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` });

    // Send a DELETE request to the server to delete the task
    this.http.delete(url, { headers }).subscribe(
      () => {
        // After successful deletion, remove the deleted task from the tasks array
        this.tasks = this.tasks.filter((task) => task._id !== taskId);
        this.filterTasks(this.currentCategory); // Update filteredTasks
      },
      (error: any) => {
        console.error('Error deleting task:', error);
      }
    );
  }

  // Method to update the status of a task (done or not done)
  updateTaskStatus(task: Task) {
    const url = `http://localhost:3000/api/tasks/${task._id}`;
    const accessToken = localStorage.getItem('accessToken'); 

    if (!accessToken) {
      console.error('Access token not available');
      return;
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` });

    
    task.isDone = !task.isDone;

    // Send a PUT request to the server to update the task status
    this.http.put<Task>(url, { isDone: task.isDone, date: task.date }, { headers }).subscribe(
      () => {
        this.filterTasks(this.currentCategory); 
      },
      (error: any) => {
        console.error('Error updating task status:', error);
        task.isDone = !task.isDone;
      }
    );
  }

  // Method to edit a task
  editTask(task: Task) {
    this.editTaskId = task._id;
  }

  // Method to update the date of a task
  updateTaskDate(task: Task) {
    if (task.date === undefined) {
      console.error('Task date cannot be undefined');
      return;
    }

    this.http
      .put<Task>(`http://localhost:3000/api/tasks/${task._id}`, task, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` }),
      })
      .subscribe(
        () => {
          this.editTaskId = null; 
          this.filterTasks(this.currentCategory);
        },
        (error: any) => {
          console.error('Error updating task date:', error);
        }
      );
  }

  // Method to cancel the edit of a task
  cancelEdit() {
    this.editTaskId = null;
  }

  // Method to select a category from the submenu
  selectCategory(category: string) {
    this.filterTasks(category);
  }
}
