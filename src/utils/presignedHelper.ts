import type { AboutSectionData } from "../types/daoTypes";

export async function uploadFilestoS3(presigned: Array<{id:string, uploadUrl: string}>, localFiles: Array<{id: string, file: File}>){
    try{
        await Promise.all(
            presigned.map(p =>{
                const match = localFiles.find(f => f.id === p.id);
                if(!match) throw new Error("File mismatch during upload");
                return uploadSingleFile(p.uploadUrl, match.file);
            })
        )
        return true;
    }catch{
        return false;
    }

}

async function uploadSingleFile(uploadUrl:string, file:File){
    const results = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type
        },
        body: file
    })

    if(!results.ok) throw new Error(`Upload failed (${results.status})`)
}

export function collectFilesFromAbout(sections: AboutSectionData[]){
    const filesToUpload : Array<{id: string, file:File}> = [];

    sections.forEach(section => {
        section.blocks.forEach(block =>{
            if(block.imageFile){
                filesToUpload.push({
                    id: block.id,
                    file: block.imageFile
                })
            }
        }) 
    })

    return filesToUpload;
}

