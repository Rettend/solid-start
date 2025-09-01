"use server";

import { posix } from 'node:path';

export function serverFnWithNodeBuiltin() {

  return posix.join('can','externalize');
}
