declare module "pdf2json" {
  class PDFParser {
    constructor(context?: any, needRawText?: boolean)
    on(event: string, callback: (data: any) => void): void
    parseBuffer(buffer: Buffer): void
  }
  export default PDFParser
}