package com.github.lihang941.minstor.service.biz.linstor.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@NoArgsConstructor
@Data
public class ApiError {
    /**
     * A masked error number
     */
    private Long ret_code;
    private String message;
    /**
     * Cause of the error
     */
    private String cause;
    /**
     * Details to the error message
     */
    private String details;
    /**
     * Possible correction options
     */
    private String correction;
    /**
     * List of error report ids related to this api call return code.
     */
    private List<String> error_report_ids = Collections.emptyList();
    /**
     * Map of objection that have been involved by the operation.
     */
    private Map<String, String> obj_refs = Collections.emptyMap();
}
