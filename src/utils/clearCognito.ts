export function clearCognito(){
    Object.keys(localStorage).forEach((key)=>{
        if(key.includes("CognitoIdentityServiceProvider")){
            localStorage.removeItem(key);
        }
    })
}