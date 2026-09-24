package com.sporekart.shared;

import com.sporekart.shared.api.SeoController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SeoModuleTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testRobotsTxtEndpoint() throws Exception {
        mockMvc.perform(get("/seo/robots.txt"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().string(containsString("User-agent: *")))
                .andExpect(content().string(containsString("Allow: /catalog/")))
                .andExpect(content().string(containsString("Disallow: /admin/")))
                .andExpect(content().string(containsString("Sitemap: https://sporekart.in/sitemap.xml")));
    }

    @Test
    void testSitemapXmlEndpoint() throws Exception {
        mockMvc.perform(get("/seo/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_XML))
                .andExpect(content().string(containsString("<urlset")))
                .andExpect(content().string(containsString("<loc>https://sporekart.in/</loc>")))
                .andExpect(content().string(containsString("<loc>https://sporekart.in/products</loc>")))
                .andExpect(content().string(containsString("<loc>https://sporekart.in/training</loc>")))
                .andExpect(content().string(containsString("<loc>https://sporekart.in/blog</loc>")));
    }
}
