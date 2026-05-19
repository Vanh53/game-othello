package com.game.game_othello;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@EnableDiscoveryClient
public class GameOthelloApplication {

	public static void main(String[] args) {
		SpringApplication.run(GameOthelloApplication.class, args);
	}

}
