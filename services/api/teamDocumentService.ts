import { BaseService } from "./baseService";
import { TeamDocument } from "@/types/teamCalendar";
import * as FileSystem from "expo-file-system/legacy";

export class TeamDocumentService extends BaseService {
  protected tableName = "team_documents";

  async getDocuments(teamId: string, eventId?: string): Promise<TeamDocument[]> {
    try {
      this.log("info", "Fetching team documents", { teamId, eventId });

      let query = this.supabase
        .from(this.tableName!)
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as TeamDocument[];
    } catch (error) {
      this.log("error", "Failed to fetch team documents", error);
      throw this.normalizeError(error);
    }
  }

  async uploadDocument(
    teamId: string,
    fileUri: string,
    fileName: string,
    eventId?: string,
  ): Promise<TeamDocument> {
    try {
      const userId = await this.getCurrentUserId();
      this.log("info", "Uploading document", { teamId, fileName, eventId });

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      const fileSize = fileInfo.size || 0;
      const maxSize = 10 * 1024 * 1024;
      if (fileSize > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      const fileExtension = fileName.split(".").pop()?.toLowerCase();
      if (fileExtension !== "pdf") {
        throw new Error("Only PDF files are allowed");
      }

      const filePath = `${teamId}/${Date.now()}-${fileName}`;

      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const byteCharacters = atob(fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from("team-documents")
        .upload(filePath, byteArray, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = this.supabase.storage
        .from("team-documents")
        .getPublicUrl(filePath);

      const { data: documentData, error: documentError } = await this.supabase
        .from(this.tableName!)
        .insert({
          team_id: teamId,
          event_id: eventId || undefined,
          file_name: fileName,
          file_url: urlData.publicUrl,
          file_size: fileSize,
          mime_type: "application/pdf",
          uploaded_by: userId,
        })
        .select()
        .single();

      if (documentError) {
        await this.supabase.storage.from("team-documents").remove([filePath]);
        throw documentError;
      }

      return documentData as TeamDocument;
    } catch (error) {
      this.log("error", "Failed to upload document", error);
      throw this.normalizeError(error);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      this.log("info", "Deleting document", { documentId });

      const { data: document, error: fetchError } = await this.supabase
        .from(this.tableName!)
        .select("file_url")
        .eq("id", documentId)
        .single();

      if (fetchError) throw fetchError;

      const filePath = document.file_url.split("/team-documents/")[1];
      if (filePath) {
        const { error: storageError } = await this.supabase.storage
          .from("team-documents")
          .remove([filePath]);

        if (storageError) {
          this.log("error", "Failed to delete file from storage", storageError);
        }
      }

      const { error: deleteError } = await this.supabase
        .from(this.tableName!)
        .delete()
        .eq("id", documentId);

      if (deleteError) throw deleteError;
    } catch (error) {
      this.log("error", "Failed to delete document", error);
      throw this.normalizeError(error);
    }
  }

  async getDocumentUrl(documentId: string): Promise<string> {
    try {
      this.log("info", "Getting document URL", { documentId });

      const { data: document, error } = await this.supabase
        .from(this.tableName!)
        .select("file_url")
        .eq("id", documentId)
        .single();

      if (error) throw error;

      if (!document.file_url) {
        throw new Error("Document does not have a file URL");
      }

      const filePath = document.file_url.split("/team-documents/")[1];
      if (!filePath) {
        if (document.file_url.startsWith("http://") || document.file_url.startsWith("https://")) {
          return document.file_url;
        }
        throw new Error("Invalid file URL format");
      }

      const { data } = await this.supabase.storage
        .from("team-documents")
        .createSignedUrl(filePath, 3600);

      if (!data?.signedUrl) {
        throw new Error("Failed to create signed URL");
      }

      return data.signedUrl;
    } catch (error) {
      this.log("error", "Failed to get document URL", error);
      throw this.normalizeError(error);
    }
  }
}

export const teamDocumentService = new TeamDocumentService();
