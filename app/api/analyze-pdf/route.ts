import { NextResponse } from "next/server"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PineconeClient } from "@pinecone-database/pinecone"
import { PineconeStore } from "langchain/vectorstores/pinecone"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const loader = new PDFLoader(buffer)
    const documents = await loader.load()

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 0,
    })

    const docs = await textSplitter.splitDocuments(documents)

    const pinecone = new PineconeClient()
    await pinecone.init({
      apiKey: process.env.PINECONE_API_KEY || "",
      environment: process.env.PINECONE_ENVIRONMENT || "",
    })

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || "")

    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }), {
      pineconeIndex: index,
      namespace: file.name.replace(/\.[^/.]+$/, ""),
    })

    return NextResponse.json({ message: "File processed successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
