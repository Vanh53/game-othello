package com.game.pvp_service.repository.httpclient;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.game.pvp_service.dto.request.OpponentsRequest;
import com.game.pvp_service.dto.response.ApiResponse;
import com.game.pvp_service.dto.response.OpponentResponse;

@FeignClient(name = "identity-service", url = "${services.identity-service.url}")
public interface UserClient {

    @PostMapping(value = "/users/opponents", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<List<OpponentResponse>> getOpponents(@RequestBody OpponentsRequest opponentsRequest);
}
