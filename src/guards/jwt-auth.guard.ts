// src/common/guards/jwt-auth.guard.ts
import { ExecutionContext, ForbiddenException,Injectable,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const result = super.canActivate(context);

        if (result instanceof Promise) {
            return result.then((canActivate) => {
                this.checkUserStatus(context);
                return canActivate;
            });
        }

        if (result instanceof Observable) {
            return result.pipe(
                map((canActivate) => {
                    this.checkUserStatus(context);
                    return canActivate;
                }),
            );
        }

        this.checkUserStatus(context);
        return result;
    }

    private checkUserStatus(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<{ user?: any }>();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Utilisateur non authentifié');
        }

    }
}
