import { SayHelloProps } from "./types";

export function sayHello({ fname, lname, age }: SayHelloProps) {
  console.log("Hello");
  console.log(`fname is ${fname}`);
  console.log(`lname is ${lname}`);
  console.log(`age is ${age}`);
}
