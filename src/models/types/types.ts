export interface IBlog {
    title: string;
    content: string;
    date: string;
    user: any;
    comments: string[];
}

export interface IComment {
    text: string;
    date: string;
    user: any;
    blog: any;
}

export interface IUser {
    name: string;
    email: string;
    password: string;
    blogs: any[];
    comments: any[];
}