package com.projetofinal.gerenciador_de_tarefas_final.controller;

import com.projetofinal.gerenciador_de_tarefas_final.model.Tarefa;
import com.projetofinal.gerenciador_de_tarefas_final.repository.TarefaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController // Indica que a classe é um controlador REST 
@RequestMapping("/api/tarefas") // Define o caminho base da API
public class TarefaController {

    @Autowired
    private TarefaRepository repository;

    // 1. LISTAGEM (Read All)
    // Endpoint: GET http://localhost:8080/api/tarefas
    @GetMapping
    public List<Tarefa> listarTodas() {
        // Retorna a lista de todas as tarefas cadastradas [cite: 18]
        return repository.findAll();
    }

    // 2. CRIAÇÃO (Create)
    // Endpoint: POST http://localhost:8080/api/tarefas
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // Retorna 201 Created
    public Tarefa criar(@Valid @RequestBody Tarefa tarefa) {
        // O @Valid garante que a validação de campos obrigatórios do Tarefa.java seja aplicada 
        // Se a validação falhar, o Spring retorna 400 Bad Request
        return repository.save(tarefa);
    }

    // 3. ATUALIZAÇÃO (Update)
    // Endpoint: PUT http://localhost:8080/api/tarefas/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Tarefa> atualizar(@PathVariable Long id, @Valid @RequestBody Tarefa tarefaDetalhes) {
        // 1. Busca a tarefa existente pelo ID
        return repository.findById(id)
                .map(tarefaExistente -> {
                    // 2. Atualiza os dados
                    tarefaExistente.setTitulo(tarefaDetalhes.getTitulo());
                    tarefaExistente.setResponsavel(tarefaDetalhes.getResponsavel());
                    tarefaExistente.setDataTermino(tarefaDetalhes.getDataTermino());
                    tarefaExistente.setDetalhamento(tarefaDetalhes.getDetalhamento());

                    // 3. Salva a tarefa atualizada no banco de dados
                    Tarefa atualizada = repository.save(tarefaExistente);
                    // 4. Retorna 200 OK com o objeto atualizado
                    return ResponseEntity.ok(atualizada);
                })
                .orElse(ResponseEntity.notFound().build()); // Retorna 404 Not Found se o ID não existir
    }

    // 4. EXCLUSÃO (Delete)
    // Endpoint: DELETE http://localhost:8080/api/tarefas/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // Retorna 204 No Content
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
        // O Frontend deve exibir a tela atualizada sem a tarefa excluída [cite: 66]
    }
}