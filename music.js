class Queue {
  constructor() {
    this.q = [];
    this.string = ''
  }

  add = (item) => {
    this.q.push(item);
  }

  print = () => {
    this.string = '';
    this.q.forEach(element => {
      this.string = this.string + ` ${element}`;
    });
    return this.string;
  }
}

queue = new Queue();
exports.q = queue;
