export default interface userData{
    mode: string,
    items: {price : string, quantity : number}[]
    business_id: string
    returnUrl: string
    customerId?: string
    email?:string
}