/**
 * `pngjs` không kèm type. Chỉ khai đúng phần đang dùng — khai rộng hơn thì phải
 * tự bảo trì một bản mô tả API mà không ai kiểm được là còn đúng hay không.
 */
declare module 'pngjs' {
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };
  }
}
