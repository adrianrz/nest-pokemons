import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {

  constructor(
    @InjectModel(Pokemon.name) // el name no es el contenido sino el nombre del modelo
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter
  ) { }




  async executeSeed() {

    this.pokemonModel.deleteMany({}); //borro todos los documentos si existieran para iniciar el seed de 0 
    
    const data:PokeResponse = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');
    const pokemonToInsert:{nro: number, name:string}[] = [];
    data.results.forEach(({name, url}) => {
       const segments = url.split('/');
       const nro = +segments[segments.length - 2] ;// el + es para que convierta el string de la url a number
       pokemonToInsert.push({nro, name}) 
    })

    this.pokemonModel.insertMany(pokemonToInsert);
    
    return 'Seed ejecutado';
  }
  
}
