export class User {
    constructor(
        public id: string,
        public first_name: string,
        public last_name: string,
        public email: string,
        public password: string,
        public phone_number: string,
        public role: 'admin' | 'user' = 'user',
    ) {}

    isAdmin(): boolean {
        return this.role === 'admin';
    }

    getFullName(): string {
        return `${this.first_name} ${this.last_name}`;
    }
}
