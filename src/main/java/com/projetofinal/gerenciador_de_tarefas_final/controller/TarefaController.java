package com.projetofinal.gerenciador_de_tarefas_final.controller;

import com.projetofinal.gerenciador_de_tarefas_final.model.Tarefa;
import com.projetofinal.gerenciador_de_tarefas_final.repository.TarefaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    @Autowired
    private TarefaRepository repository;

    @GetMapping
    public List<Tarefa> listarTodas() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tarefa> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(tarefa -> ResponseEntity.ok(tarefa)) 
                .orElse(ResponseEntity.notFound().build()); 
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Tarefa criar(@Valid @RequestBody Tarefa tarefa) {
        return repository.save(tarefa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tarefa> atualizar(@PathVariable Long id, @Valid @RequestBody Tarefa tarefaDetalhes) {
        return repository.findById(id)
                .map(tarefaExistente -> {
                    tarefaExistente.setTitulo(tarefaDetalhes.getTitulo());
                    tarefaExistente.setResponsavel(tarefaDetalhes.getResponsavel());
                    tarefaExistente.setDataTermino(tarefaDetalhes.getDataTermino());
                    tarefaExistente.setDetalhamento(tarefaDetalhes.getDetalhamento());

                    Tarefa atualizada = repository.save(tarefaExistente);
                    return ResponseEntity.ok(atualizada);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        repository.deleteById(id);
    }
}