package com.sporekart.catalog.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResponse {
    private List<SearchResultItem> products;
    private List<SearchResultItem> categories;
    private List<SearchResultItem> training;
    private List<SearchResultItem> blogs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResultItem {
        private String id;
        private String title;
        private String subtitle;
        private String slug;
        private String type;
        private String url;
        private String imageUrl;
        private String priceInr;
    }
}
