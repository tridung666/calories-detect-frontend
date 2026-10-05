// Clear the client's JSON default so the browser supplies the multipart boundary.
export const imageUploadConfig = {
  headers: { "Content-Type": undefined },
  timeout: 60_000,
}

export const imageFormData = (file: File) => {
  const data = new FormData()
  data.append("file", file)
  return data
}
