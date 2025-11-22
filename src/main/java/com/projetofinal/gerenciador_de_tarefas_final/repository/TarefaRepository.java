package com.projetofinal.gerenciador_de_tarefas_final.repository;

import com.projetofinal.gerenciador_de_tarefas_final.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
}