export interface User {
    _id?:string | object
    name: string;
    email: string;
    role?: string;
    password: string;
    pages: string[]
}