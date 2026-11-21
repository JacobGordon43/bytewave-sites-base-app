type Claims = Record<string, unknown>;

export function getBusinessIdFromClaims(claims: Claims): string | undefined {
    const businessId = claims["custom:businessId"] ?? claims.businessId;
    return typeof businessId === "string" ? businessId : undefined;
}

export function getRolesFromClaims(claims: Claims) : string[]{
    const roles = claims["cognito:groups"] ?? claims.roles;
    if(Array.isArray(roles)){
        return roles.filter((role): role is string => typeof role === "string");
    }

    if(typeof roles === "string"){
        const cleaned = roles.startsWith("[") && roles.endsWith("]") 
            ? roles.slice(1, -1)
            : roles;

            return cleaned
                .split(/[,\s]+/)
                .map((role)=>role.trim())
                .filter(Boolean)
    }

    return []
}
