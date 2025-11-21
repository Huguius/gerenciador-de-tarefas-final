package com.projetofinal.gerenciador_de_tarefas_final.repository;

import com.projetofinal.gerenciador_de_tarefas_final.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// JpaRepository aceita dois tipos: 
// 1. A Entidade que ele irá gerenciar (Tarefa)
// 2. O tipo da Chave Primária da Entidade (Long)
@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
}