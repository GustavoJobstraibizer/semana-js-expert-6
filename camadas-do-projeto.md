# Câmadas do projeto

## Server

- **service** = tudo que é regra de negocio ou processamento.
- **controller**  = intermediar a camada de apresentação e a camada de negocio.
- **routes**      = camada de apresentação.
- **server**      = responsavel por criar o servidor (mas nao instancia).
- **index**       = instancia o servidor e expoe para a web (lado da infraestrutura).
- **config**      = tudo que for estático do projeto.

---

## Client
   - **view**         = Camada de apresentação tudo que for elementos HTML.
   - **controller**   = Intermediar a camada de apresentação e a camada de negocio.
   - **service**      = Camada de negocio.
   - **index**        = Factory = Responavel por inicializar tudo. 

// comandos linux

apt list --installed