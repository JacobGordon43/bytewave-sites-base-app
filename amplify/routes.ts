import { HttpApi, type HttpMethod, type IHttpRouteAuthorizer } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { IFunction } from "aws-cdk-lib/aws-lambda";

type RouteConfig = {
    path: string,
    method: HttpMethod,
    integrationId: string,
    lambda: IFunction,
    protected ?: boolean
}

export function addApiRoutes({
    httpApi, jwtAuthorizer,
    routes
} : {
    httpApi : HttpApi,
    jwtAuthorizer: IHttpRouteAuthorizer,
    routes: RouteConfig[]
}){
    for(const route of routes){
        httpApi.addRoutes({
            path: route.path,
            methods: [route.method],
            integration: new HttpLambdaIntegration(
                route.integrationId, route.lambda
            ),
            authorizer: route.protected ? jwtAuthorizer : undefined
        })
    }
}