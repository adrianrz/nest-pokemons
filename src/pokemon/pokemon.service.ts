import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name) // el name no es el contenido sino el nombre del modelo
    private readonly pokemonModel: Model<Pokemon>
  ) { }

  async create(createPokemonDto: CreatePokemonDto) {

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions( error );
    }
  }

  async findAll() {
    let pokemon = await this.pokemonModel.find({});
    return pokemon;
  }

  async findOne(term: string) {
    let pokemon: Pokemon;
    //nro. de pokemon
    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ nro: term });
    }
    // MongoID
    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }
    // Name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase() });
    }

    if (!pokemon) throw new NotFoundException(`No se encontró un pokemon con id, nro. o nombre ${term} `);

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(term);
    if (updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    try {
      await pokemon.updateOne(updatePokemonDto, { new: true }); // el new en true es para que devuelva el objeto actualizado    
    } catch (error) {
       this.handleExceptions( error);
    }
    return { ...pokemon.toJSON(), ...updatePokemonDto };
  }

  async remove(id: string) {
    //const pokemon = await this.findOne(id);
    
    /*  //await pokemon.deleteOne(); // no hace falta enviarle el id porque pokemon es un objeto de mongoose  
      const result = await this.pokemonModel.findByIdAndDelete(id);   
    } catch (error) {
       this.handleExceptions( error);
    }
    return `El pokemon #${result} ha sido eliminado de la bbdd`;*/

    const { deletedCount } = await this.pokemonModel.deleteOne( {_id_: id});
    
    if (deletedCount===0) throw new BadRequestException(`El pokemon #${id} ha sido eliminado de la bbdd`)
  }

  private handleExceptions (error: any) {
    // para no llamar más veces a la bbdd para verificar si existe el registro por nro. o por name, capturo el codigo de error
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon existe en la bbdd: ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error);
    throw new InternalServerErrorException('No se puede crear el registro, revise el log');

  }
}
