package com.sporekart.catalog.api;

import com.sporekart.catalog.api.dto.GlobalSearchResponse;
import com.sporekart.catalog.application.GlobalSearchService;
import com.sporekart.shared.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    public ResponseEntity<ApiResponse<GlobalSearchResponse>> search(@RequestParam(value = "q", required = false) String query) {
        GlobalSearchResponse response = globalSearchService.search(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
