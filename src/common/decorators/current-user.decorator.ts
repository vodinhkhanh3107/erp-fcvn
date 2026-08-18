import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Lấy payload JWT (đã gán vào request.user bởi JwtAuthGuard) */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  // console.log(request.user);
  return request.user;
});
