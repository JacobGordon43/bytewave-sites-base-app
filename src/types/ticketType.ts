export default interface TicketProps{
    ticketId: string
    messages : {from: "support" | "client", message: string}[]
    category : string
    date : Date
    status: "Completed" | "In Progress" | "Not Started"
}