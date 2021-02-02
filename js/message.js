class Message {

  constructor(type, data) {
    this.type = type;
    this.data = data;
  }

  toJson() {
      return JSON.stringify({
          type: this.type,
          data: this.data
      });
  }
}