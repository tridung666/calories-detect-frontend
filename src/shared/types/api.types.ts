export interface BaseResponse<TData> {
  success: boolean;
  code: number;
  message: string;
  data: TData;
}
