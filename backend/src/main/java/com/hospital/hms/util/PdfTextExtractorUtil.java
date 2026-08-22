package com.hospital.hms.util;

import com.hospital.hms.exception.BadRequestException;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Extracts raw text from an uploaded PDF (e.g. a lab report) so it can be
 * fed to the AI summarizer. Only handles text-based PDFs — scanned/image-only
 * PDFs would need OCR, which is out of scope here.
 */
@Component
public class PdfTextExtractorUtil {

    private static final int MAX_PAGES = 20;
    private static final int MAX_CHARS = 20_000; // keep prompts within a reasonable token budget

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded");
        }
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new BadRequestException("Only PDF files are supported for report summarization");
        }

        try (InputStream inputStream = file.getInputStream();
             PdfReader reader = new PdfReader(inputStream);
             PdfDocument pdfDoc = new PdfDocument(reader)) {

            StringBuilder text = new StringBuilder();
            int pageCount = Math.min(pdfDoc.getNumberOfPages(), MAX_PAGES);
            for (int i = 1; i <= pageCount; i++) {
                text.append(PdfTextExtractor.getTextFromPage(pdfDoc.getPage(i))).append("\n");
                if (text.length() > MAX_CHARS) {
                    break;
                }
            }

            String result = text.toString().trim();
            if (result.isEmpty()) {
                throw new BadRequestException(
                        "Couldn't read any text from this PDF — it may be a scanned image rather than text.");
            }
            return result.length() > MAX_CHARS ? result.substring(0, MAX_CHARS) : result;

        } catch (IOException ex) {
            throw new BadRequestException("This file could not be read as a PDF");
        }
    }
}
