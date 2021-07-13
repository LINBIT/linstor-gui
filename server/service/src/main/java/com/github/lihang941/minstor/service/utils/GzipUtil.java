package com.github.lihang941.minstor.service.utils;


import com.github.lihang941.tool.common.exception.ErrorMsgException;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.Base64;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;


@Slf4j
public class GzipUtil {


    public static String compress(String data) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        GZIPOutputStream gzip;
        try {
            gzip = new GZIPOutputStream(out);
            gzip.write(data.getBytes("UTF-8"));
            gzip.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return Base64.getEncoder().encodeToString(out.toByteArray());
    }

    public static String uncompress(String data) {
        byte[] decode = Base64.getDecoder().decode(data);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ByteArrayInputStream in = new ByteArrayInputStream(decode);
        try (GZIPInputStream gzipStream = new GZIPInputStream(in);) {
            byte[] buffer = new byte[256];
            int n;
            while ((n = gzipStream.read(buffer)) >= 0) {
                out.write(buffer, 0, n);
            }
        } catch (IOException e) {
            log.info("Save failed e = ", e);
            throw new ErrorMsgException("Save failed");
        }
        return new String(out.toByteArray(), Charset.forName("UTF-8"));
    }

}
