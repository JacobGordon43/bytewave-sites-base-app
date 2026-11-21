

export default interface paymentCard{
    title: string,
    due: number,
    mode : "subscription" | "payment",
    items : {price: string, quantity: number}[],
    onError: (error:string) =>void
}