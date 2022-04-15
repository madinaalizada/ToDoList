const dragArea = document.querySelector("#todo-list");
new Sortable(dragArea, {
  animation: 350,
});

const TODOS = "TODOS";
class Todo {
  /**
   * Creates todo element.
   * @param {number} id Identifier.
   * @param {string} [title] Title. Default is empty string.
   */
  constructor(id, title = "") {
    /**
     * @type {number}
     */
    this.id = id;
    /**
     * @type {string}
     */
    this.title = title.trim();
  }
}

class DataChangeEvent {
  constructor() {
    this._listeners = [];
  }

  subscribe(..._listeners) {
    this._listeners = [...this._listeners, ..._listeners];
  }

  emit(data) {
    this._listeners.forEach((listener) => listener(data));
  }
}

class TodoService {
  /**
   * Todo list.
   * @type {Todo[]}.
   * @private
   */
  _todos;

  constructor(todos = []) {
    this._init();
    this.dataChangeEvent = new DataChangeEvent();

    if (!this._todos?.length) {
      this._todos = todos;
      this._commit();
    }
  }

  /**
   * Gets todos.
   * @returns Todos array.
   */
  getTodos() {
    return [...this._todos];
  }

  /**
   * Adds new todo by title.
   * @param {string} [title] - Todo title. Default is empty string.
   */
  addTodo(title = "") {
    if (!this._todos.some((t) => !t.title)) {
      this._todos = [...this._todos, new Todo(this._generateId(), title)];
      this._commit();
    } else {
      throw new Error("There is empty element in todo list");
    }
  }

  /**
   * Edits todo by identifier.
   * @param {number} id Todo's id.
   * @param {string} title Title.
   * @throws Throws error when title argument is empty.
   */
  editTodo(id, title) {
    if (!title) throw new Error("You can not empty title.");
    const todos = [...this._todos];
    todos[this._getIndex(id)].title = title.trim();
    this._todos = todos;
    this._commit();
  }

  /**
   * Delete todo by identifier.
   * @param {number} id Todo's identifier.
   */
  deleteTodo(id) {
    this._todos = this._todos.filter((t) => t.id !== id);

    this._commit();
  }

  /**
   * Sort todo array.
   * @param {boolean?} direction Sorting direction. Default is true.
   */
  sortTodos(direction = true) {
    const todos = [...this._todos]
      .filter((t) => t.title)
      .sort((t1, t2) =>
        t1.title.toUpperCase() > t2.title.toUpperCase() ? 1 : -1
      );
    if (!direction) todos.reverse();
    this._todos = todos;
    this._commit();
  }

  /**
   * Initialize todos from storage.
   * @private
   */
  _init() {
    this._todos = JSON.parse(localStorage.getItem(TODOS) || "[]");
  }

  /**
   * Commits changes to storage.
   * @private
   */
  _commit() {
    localStorage.setItem(TODOS, JSON.stringify(this._todos));
    this.dataChangeEvent.emit();
  }

  /**
   * Generates next available id or 1 if todo array is empty.
   * @private
   * @returns {number} Id.
   */
  _generateId() {
    return this._todos?.length
      ? [...this._todos].sort((t1, t2) => t2.id - t1.id)[0].id + 1
      : 1;
  }

  /**
   * Gets index of todo in "todo" array.
   * @private
   * @param {number} id Todo identifier.
   * @throws Throws error when there are no todo with given id.
   * @returns Index of todo in "todos" array.
   */
  _getIndex(id) {
    const index = this._todos.findIndex((t) => t.id === id);

    if (index !== -1) {
      return index;
    }

    throw new Error(`There are no such todo with ${id} id.`);
  }
}

class DOMManipulator {
  /**
   * @private
   * @readonly
   * @type {TodoService} Todo service.
   */
  _service;

  constructor(service) {
    this._service = service;
    this._init();
  }

  _init() {
    /** @type {HTMLUListElement} */
    this._todoList = this._getElement("#todo-list");
    /** @type {HTMLButtonElement} */
    this._addBtn = this._getElement("#add-btn");
    this._addBtn.addEventListener("click", (_) => this._handleAdd());
    /** @type {HTMLButtonElement} */
    this._sortBtn = this._getElement("#sort-btn");
    this._sortBtn.addEventListener("click", (_) => this._handleSort());
    this._sortDir = true;

    this._service.dataChangeEvent.subscribe(() => this.displayTodos());

    this.displayTodos();
  }

  displayTodos() {
    const todos = this._service.getTodos();
    const items = todos.map((t) => {
      const item = document.createElement("li");
      const todoInput = document.createElement("input");
      todoInput.value = t.title;
      todoInput.addEventListener("change", (e) =>
        this._handleEdit(t.id, e.target.value)
      );
      item.append(todoInput);

      const delBtn = document.createElement("button");
      delBtn.classList.add("del-btn");
      delBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#C4C4C4"/>
            <path d="M6 6L14 14" stroke="#C4C4C4"/>
            <path d="M6 14L14 6" stroke="#C4C4C4"/>
            </svg>
            `;
      delBtn.addEventListener("click", (_) => this._handleDelete(t.id));
      item.append(delBtn);
      return item;
    });

    this._todoList.innerHTML = "";
    this._todoList.append(...items);
  }

  _handleEdit(id, title) {
    try {
      this._service.editTodo(id, title);
    } catch (error) {
      this._showError(error.message);
    }
  }

  _handleAdd() {
    try {
      this._service.addTodo();
      this._sortDir = true; //sile bilersen
    } catch (error) {
      this._showError(error.message);
    }
  }

  /**
   * @param {number} id Todo identifier.
   */
  _handleDelete(id) {
    this._service.deleteTodo(id);
  }

  _handleSort() {
    this._service.sortTodos(this._sortDir);
    this._sortDir = !this._sortDir;

    if (this._sortDir) {
      this._sortBtn.innerHTML = `<svg width="25" height="15" viewBox="0 0 25 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" width="2.5" height="12.5" fill="#C4C4C4"/>
            <rect x="10" y="3.75" width="2.5" height="7.5" transform="rotate(-90 10 3.75)" fill="#C4C4C4"/>
            <rect x="10" y="8.75" width="2.5" height="10" transform="rotate(-90 10 8.75)" fill="#C4C4C4"/>
            <rect x="10" y="13.75" width="2.5" height="15" transform="rotate(-90 10 13.75)" fill="#C4C4C4"/>
            <path d="M3.75 15L0.502405 10.3125L6.9976 10.3125L3.75 15Z" fill="#C4C4C4"/>
            </svg>
            `;
    } else {
      this._sortBtn.innerHTML = `<svg width="25" height="15" viewBox="0 0 25 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="15" width="2.5" height="12.5" transform="rotate(-180 5 15)" fill="#C4C4C4"/>
            <rect x="10" y="3.75" width="2.5" height="7.5" transform="rotate(-90 10 3.75)" fill="#C4C4C4"/>
            <rect x="10" y="8.75" width="2.5" height="10" transform="rotate(-90 10 8.75)" fill="#C4C4C4"/>
            <rect x="10" y="13.75" width="2.5" height="15" transform="rotate(-90 10 13.75)" fill="#C4C4C4"/>
            <path d="M3.75 6.55671e-07L6.99759 4.6875L0.502404 4.6875L3.75 6.55671e-07Z" fill="#C4C4C4"/>
            </svg>
            `;
    }
  }

  /**
   * Gets element by selector.
   * @param {string} selector Element selector for getting element from document.
   * @private
   * @throws Throws error if there are no element with given selector.
   * @returns {HTMLElement} HTML element.
   */
  _getElement(selector) {
    const element = document.querySelector(selector);

    if (element) {
      return element;
    }
    throw new Error(`There are no such element : ${selector}.`);
  }

  _showError(message) {
    const alert = document.querySelector('#alert');
    document.querySelector('#alert span').textContent = message;
    alert.style.display = 'block';
    setTimeout(() => {alert.style.display = 'none'}, 3000);
  }
}

const manipulator = new DOMManipulator(new TodoService([{ id: 1, title: "" }]));
