package com.sporekart.content.application;

import com.sporekart.content.domain.Article;
import com.sporekart.content.infrastructure.ContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentApplicationService {

    private final ContentRepository contentRepository;

    public List<Article> getAllArticles() {
        return contentRepository.findAll();
    }
}
