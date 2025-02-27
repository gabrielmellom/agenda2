"use client";

import React from 'react';

// Componente para a etapa de seleção de serviço
export function ServiceSelection({ servicos, onServiceSelect }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-6 text-purple-700">Escolha o Serviço</h2>

      {servicos.length === 0 ? (
        <div className="bg-yellow-50 p-6 rounded-lg text-yellow-700 text-center border border-yellow-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">Nenhum serviço disponível para este profissional.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicos.map(servico => (
            <div
              key={servico.id}
              className="border border-purple-100 rounded-lg p-5 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors shadow-sm"
              onClick={() => onServiceSelect(servico)}
            >
              <h3 className="font-semibold text-lg text-purple-800 mb-1">{servico.nome}</h3>
              {servico.descricao && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{servico.descricao}</p>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-100">
                <span className="text-gray-600 flex items-center text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {servico.duracao} min
                </span>
                <span className="font-bold text-lg text-purple-800">
                  R$ {parseFloat(servico.preco).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para a etapa de seleção de data e hora
export function CalendarSelection({
  selectedService,
  currentMonth,
  selectedDate,
  selectedTime,
  timeSlots,
  duracaoIntervalo,
  nomesDosMeses,
  formatDate,
  generateCalendarDays,
  goToPreviousMonth,
  goToNextMonth,
  handleBackToServices,
  handleDateSelect,
  handleTimeSelect,
  handleContinueToClientData
}) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={handleBackToServices}
          className="text-purple-600 flex items-center mb-4 hover:text-purple-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar para serviços
        </button>

        <h2 className="text-xl font-bold mb-3 text-purple-700">Escolha a Data e Horário</h2>
        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium text-purple-800">{selectedService.nome}</span>
          </div>
          <div className="flex justify-between text-sm mt-2 text-gray-700">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Duração: {selectedService.duracao} min
            </span>
            <span className="font-semibold">
              R$ {parseFloat(selectedService.preco).toFixed(2).replace('.', ',')}
            </span>
          </div>
          {duracaoIntervalo > 0 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              + {duracaoIntervalo} min de intervalo entre sessões
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg border border-purple-100 p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-purple-100 text-purple-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg font-semibold text-purple-800">
            {nomesDosMeses[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-purple-100 text-purple-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((day, index) => {
            const isSelected = selectedDate &&
              day.date.getDate() === selectedDate.getDate() &&
              day.date.getMonth() === selectedDate.getMonth() &&
              day.date.getFullYear() === selectedDate.getFullYear();

            const isToday = new Date().toDateString() === day.date.toDateString();

            return (
              <div
                key={index}
                className={`
                  p-2 text-center rounded-md text-sm relative
                  ${!day.inMonth ? 'text-gray-300' : day.isPast ? 'text-gray-300' : day.hasSlots ? 'cursor-pointer' : 'text-gray-400'}
                  ${isSelected ? 'bg-purple-600 text-white font-medium' : isToday ? 'bg-purple-100 font-medium' : ''}
                  ${day.inMonth && day.hasSlots && !isSelected ? 'hover:bg-purple-50' : ''}
                `}
                onClick={() => day.hasSlots && handleDateSelect(day)}
              >
                {day.date.getDate()}
                {day.inMonth && day.hasSlots && !isSelected && (
                  <div className="h-1 w-1 rounded-full bg-green-500 mx-auto mt-1"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="animate-fadeIn">
          <h3 className="text-lg font-medium mb-4 text-purple-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Horários para {formatDate(selectedDate)}:
          </h3>

          {timeSlots.length === 0 ? (
            <div className="text-gray-500 text-center p-6 bg-gray-50 rounded-lg border border-gray-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Não há horários disponíveis para este serviço nesta data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  className={`py-3 px-2 rounded-lg text-center transition-colors relative
                    ${selectedTime === slot
                      ? 'bg-purple-600 text-white shadow-md border border-purple-700'
                      : slot.conflicted
                        ? 'bg-red-50 text-gray-400 border border-red-100 cursor-not-allowed'
                        : 'bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-400 text-gray-800'
                    }`}
                  onClick={() => handleTimeSelect(slot)}
                  disabled={slot.conflicted}
                >
                  <span className={`${selectedTime === slot ? 'font-medium' : ''}`}>
                    {slot.inicio} - {slot.fim}
                  </span>
                  {slot.conflicted && (
                    <div className="text-xs text-red-500 mt-1 font-medium">
                      Indisponível
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {selectedTime && (
            <div className="mt-8 flex justify-center">
              <button
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center"
                onClick={handleContinueToClientData}
              >
                Continuar
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para a etapa de dados do cliente
export function ClientDataForm({
  clienteData,
  formErrors,
  selectedService,
  selectedDate,
  selectedTime,
  loading,
  formatDate,
  handleBackToCalendar,
  handleInputChange,
  handleCPFChange,
  handlePhoneChange,
  handleSubmit
}) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={handleBackToCalendar}
          className="text-purple-600 flex items-center mb-4 hover:text-purple-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Voltar para calendário
        </button>

        <h2 className="text-xl font-bold mb-4 text-purple-700">Seus Dados</h2>

        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-100 shadow-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium text-purple-800">{selectedService.nome}</span>
          </div>
          <p className="text-sm my-2 flex items-center text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(selectedDate)}
          </p>
          <p className="text-sm mb-2 flex items-center text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {selectedTime.inicio} - {selectedTime.fim} ({selectedService.duracao} min)
          </p>
          <p className="text-sm pt-2 border-t border-purple-200 flex justify-end font-bold text-purple-800">
            Total: R$ {parseFloat(selectedService.preco).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo*
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={clienteData.nome}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.nome ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="Seu nome completo"
          />
          {formErrors.nome && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {formErrors.nome}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
            CPF*
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={clienteData.cpf}
            onChange={handleCPFChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.cpf ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="000.000.000-00"
            maxLength="14"
          />
          {formErrors.cpf && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {formErrors.cpf}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone*
          </label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            value={clienteData.telefone}
            onChange={handlePhoneChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.telefone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="(00) 00000-0000"
            maxLength="15"
          />
          {formErrors.telefone && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {formErrors.telefone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={clienteData.email}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            placeholder="seu@email.com"
          />
          {formErrors.email && (
            <p className="text-red-500 text-sm mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {formErrors.email}
            </p>
          )}
        </div>
        
        <p className="text-xs text-gray-500 italic">
          * Todos os campos são obrigatórios
        </p>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full p-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                Processando...
              </>
            ) : (
              <>
                Continuar para Pagamento
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}